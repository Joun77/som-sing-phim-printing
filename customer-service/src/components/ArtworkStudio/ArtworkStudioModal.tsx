import React, { useState, useRef, useEffect } from 'react'
import { CheckIcon } from '../icons.tsx'

export interface CanvasElement {
  id: string
  type: 'text' | 'image' | 'sticker' | 'frame'
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  // Text properties
  text?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  fontWeight?: string
  fontStyle?: string
  textAlign?: 'left' | 'center' | 'right'
  letterSpacing?: number
  shadow?: boolean
  // Image properties
  src?: string
  opacity?: number
  // Sticker / Frame properties
  stickerType?: string
}

interface ArtworkStudioModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (artworkDataUrl: string) => void
  productName: string
  aspectRatio?: number // width / height
  initialImage?: string | null
}

const LUXURY_COLORS = [
  { name: 'Champagne Gold', value: '#C5A059' },
  { name: 'Light Gold', value: '#EBD8B2' },
  { name: 'Deep Navy', value: '#070D1E' },
  { name: 'Royal Blue', value: '#142145' },
  { name: 'Ivory White', value: '#FDFBF7' },
  { name: 'Pure White', value: '#FFFFFF' },
  { name: 'Charcoal Noir', value: '#18181B' },
  { name: 'Burgundy Crimson', value: '#881337' },
  { name: 'Emerald Forest', value: '#065F46' },
]

const BG_PRESETS = [
  { name: 'Midnight Atelier', value: '#070D1E' },
  { name: 'Royal Sapphire', value: '#0E172F' },
  { name: 'Ivory Cream', value: '#FDFBF7' },
  { name: 'Pure White', value: '#FFFFFF' },
  { name: 'Obsidian Black', value: '#111827' },
  { name: 'Gold Foil Gradient', gradient: 'linear-gradient(135deg, #2A1E08 0%, #070D1E 100%)' },
]

const STICKER_PRESETS = [
  { id: 'gold-seal', name: '★ Premium Quality Seal ★', icon: '👑', svg: 'seal' },
  { id: 'luxury-frame', name: 'Luxury Double Frame', icon: '🖼️', svg: 'frame' },
  { id: 'atelier-ribbon', name: 'Som Sing Phim Ribbon', icon: '🎀', svg: 'ribbon' },
  { id: 'gold-divider', name: 'Vintage Gold Divider', icon: '✦', svg: 'divider' },
  { id: 'love-crest', name: 'Romantic Monogram Crest', icon: '❦', svg: 'crest' },
]

const FONTS = [
  { name: 'Noto Sans Lao (ລາວ)', value: "'Noto Sans Lao', sans-serif" },
  { name: 'Sarabun (ไทย/สากล)', value: "'Sarabun', sans-serif" },
  { name: 'Plus Jakarta Sans (Modern)', value: "'Plus Jakarta Sans', sans-serif" },
  { name: 'Cinzel (Luxury Serif)', value: "'Cinzel', 'Playfair Display', serif" },
]

export default function ArtworkStudioModal({
  isOpen,
  onClose,
  onSave,
  productName,
  aspectRatio = 1,
  initialImage,
}: ArtworkStudioModalProps) {
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [bgColor, setBgColor] = useState<string>('#070D1E')
  const [showGuides, setShowGuides] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'stickers' | 'background' | 'preview'>('text')
  const [isExporting, setIsExporting] = useState(false)

  // Dragging & Resizing states
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Canvas visual dimensions
  const CANVAS_WIDTH = 560
  const CANVAS_HEIGHT = Math.round(CANVAS_WIDTH / (aspectRatio || 1))

  // Initialize with initial image or preset template if empty
  useEffect(() => {
    if (isOpen && elements.length === 0) {
      if (initialImage && (initialImage.startsWith('data:') || initialImage.startsWith('http') || initialImage.startsWith('blob:'))) {
        setElements([
          {
            id: 'img-init',
            type: 'image',
            x: 40,
            y: 40,
            width: CANVAS_WIDTH - 80,
            height: CANVAS_HEIGHT - 80,
            src: initialImage,
            opacity: 1,
          },
        ])
      } else {
        // Default luxury starter template
        setElements([
          {
            id: 'title-1',
            type: 'text',
            x: CANVAS_WIDTH / 2 - 140,
            y: CANVAS_HEIGHT * 0.4,
            width: 280,
            height: 50,
            text: productName || 'SOM SING PHIM',
            fontSize: 26,
            fontFamily: "'Noto Sans Lao', sans-serif",
            color: '#EBD8B2',
            fontWeight: '800',
            textAlign: 'center',
            shadow: true,
          },
          {
            id: 'sub-1',
            type: 'text',
            x: CANVAS_WIDTH / 2 - 120,
            y: CANVAS_HEIGHT * 0.4 + 54,
            width: 240,
            height: 30,
            text: 'Premium Bespoke Printing',
            fontSize: 13,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: '#C5A059',
            fontWeight: '600',
            textAlign: 'center',
            letterSpacing: 2,
          },
        ])
      }
    }
  }, [isOpen, initialImage, productName, CANVAS_WIDTH, CANVAS_HEIGHT, elements.length])

  // Redraw Canvas on every state change
  useEffect(() => {
    if (!isOpen) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 1. Draw Background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 2. Draw Elements in order
    elements.forEach((el) => {
      ctx.save()

      if (el.type === 'text' && el.text) {
        ctx.font = `${el.fontWeight || 'normal'} ${el.fontStyle || 'normal'} ${el.fontSize || 20}px ${el.fontFamily || 'sans-serif'}`
        ctx.fillStyle = el.color || '#FFFFFF'
        ctx.textAlign = el.textAlign || 'left'
        ctx.textBaseline = 'top'

        if (el.shadow) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.65)'
          ctx.shadowBlur = 8
          ctx.shadowOffsetX = 2
          ctx.shadowOffsetY = 3
        }

        const alignX =
          el.textAlign === 'center' ? el.x + el.width / 2 : el.textAlign === 'right' ? el.x + el.width : el.x
        ctx.fillText(el.text, alignX, el.y)
      } else if (el.type === 'image' && el.src) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = el.src
        if (img.complete) {
          ctx.globalAlpha = el.opacity ?? 1
          ctx.drawImage(img, el.x, el.y, el.width, el.height)
        } else {
          img.onload = () => {
            ctx.globalAlpha = el.opacity ?? 1
            ctx.drawImage(img, el.x, el.y, el.width, el.height)
          }
        }
      } else if (el.type === 'sticker') {
        drawStickerGraphic(ctx, el)
      }

      ctx.restore()

      // If Selected, draw Gold Bounding Box
      if (el.id === selectedId) {
        ctx.save()
        ctx.strokeStyle = '#C5A059'
        ctx.lineWidth = 1.8
        ctx.setLineDash([4, 4])
        ctx.strokeRect(el.x - 4, el.y - 4, el.width + 8, el.height + 8)

        // Corner handles
        ctx.fillStyle = '#EBD8B2'
        const handles = [
          { x: el.x - 4, y: el.y - 4 },
          { x: el.x + el.width + 4, y: el.y - 4 },
          { x: el.x - 4, y: el.y + el.height + 4 },
          { x: el.x + el.width + 4, y: el.y + el.height + 4 },
        ]
        handles.forEach((h) => {
          ctx.beginPath()
          ctx.arc(h.x, h.y, 4.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        })
        ctx.restore()
      }
    })

    // 3. Draw Bleed & Safe Guides if enabled
    if (showGuides) {
      ctx.save()
      const bleedMargin = 16
      const safeMargin = 32

      // Trim line (Gold border)
      ctx.strokeStyle = 'rgba(197, 160, 89, 0.4)'
      ctx.lineWidth = 1
      ctx.setLineDash([])
      ctx.strokeRect(bleedMargin, bleedMargin, canvas.width - bleedMargin * 2, canvas.height - bleedMargin * 2)

      // Bleed line (Red dashed outer)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)'
      ctx.lineWidth = 1.2
      ctx.setLineDash([6, 6])
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8)

      // Safe Zone (Emerald green dashed inner)
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.65)'
      ctx.lineWidth = 1.2
      ctx.setLineDash([4, 4])
      ctx.strokeRect(safeMargin, safeMargin, canvas.width - safeMargin * 2, canvas.height - safeMargin * 2)

      // Labels
      ctx.font = '10px sans-serif'
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)'
      ctx.fillText('✂️ Bleed 3mm', 8, 14)
      ctx.fillStyle = 'rgba(16, 185, 129, 0.8)'
      ctx.fillText('🛡️ Safe Zone', safeMargin + 6, safeMargin + 14)
      ctx.restore()
    }
  }, [isOpen, elements, selectedId, bgColor, showGuides, CANVAS_WIDTH, CANVAS_HEIGHT])

  const drawStickerGraphic = (ctx: CanvasRenderingContext2D, el: CanvasElement) => {
    ctx.save()
    if (el.stickerType === 'seal') {
      ctx.strokeStyle = '#C5A059'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(el.x + el.width / 2, el.y + el.height / 2, el.width / 2 - 4, 0, Math.PI * 2)
      ctx.stroke()

      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(el.x + el.width / 2, el.y + el.height / 2, el.width / 2 - 10, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = '#EBD8B2'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('★ SOM SING PHIM ★', el.x + el.width / 2, el.y + el.height / 2 - 4)
      ctx.font = '9px sans-serif'
      ctx.fillText('PREMIUM QUALITY', el.x + el.width / 2, el.y + el.height / 2 + 10)
    } else if (el.stickerType === 'frame') {
      ctx.strokeStyle = '#C5A059'
      ctx.lineWidth = 2
      ctx.strokeRect(el.x, el.y, el.width, el.height)
      ctx.lineWidth = 1
      ctx.strokeRect(el.x + 6, el.y + 6, el.width - 12, el.height - 12)
    } else if (el.stickerType === 'divider') {
      ctx.strokeStyle = '#C5A059'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(el.x, el.y + el.height / 2)
      ctx.lineTo(el.x + el.width / 2 - 12, el.y + el.height / 2)
      ctx.moveTo(el.x + el.width / 2 + 12, el.y + el.height / 2)
      ctx.lineTo(el.x + el.width, el.y + el.height / 2)
      ctx.stroke()

      ctx.fillStyle = '#EBD8B2'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('✦', el.x + el.width / 2, el.y + el.height / 2 + 5)
    }
    ctx.restore()
  }

  // Element Actions
  const addTextElement = (presetText = 'ຂໍ້ຄວາມໃໝ່ (New Text)', fontSize = 22, isHeading = false) => {
    const newEl: CanvasElement = {
      id: 'text-' + Date.now(),
      type: 'text',
      x: CANVAS_WIDTH / 2 - 100,
      y: CANVAS_HEIGHT / 2 - 20,
      width: 200,
      height: fontSize + 10,
      text: presetText,
      fontSize: fontSize,
      fontFamily: isHeading ? "'Cinzel', serif" : "'Noto Sans Lao', sans-serif",
      color: '#EBD8B2',
      fontWeight: isHeading ? '800' : '600',
      textAlign: 'center',
      shadow: true,
    }
    setElements([...elements, newEl])
    setSelectedId(newEl.id)
  }

  const addSticker = (preset: (typeof STICKER_PRESETS)[0]) => {
    const newEl: CanvasElement = {
      id: 'sticker-' + Date.now(),
      type: 'sticker',
      stickerType: preset.svg,
      x: CANVAS_WIDTH / 2 - 60,
      y: CANVAS_HEIGHT / 2 - 60,
      width: preset.svg === 'divider' ? 240 : 120,
      height: preset.svg === 'divider' ? 30 : 120,
    }
    setElements([...elements, newEl])
    setSelectedId(newEl.id)
  }

  const onUploadImage = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        const aspect = img.width / img.height
        let w = 220
        let h = Math.round(w / aspect)
        if (h > 240) {
          h = 240
          w = Math.round(h * aspect)
        }
        const newEl: CanvasElement = {
          id: 'img-' + Date.now(),
          type: 'image',
          x: CANVAS_WIDTH / 2 - w / 2,
          y: CANVAS_HEIGHT / 2 - h / 2,
          width: w,
          height: h,
          src: src,
          opacity: 1,
        }
        setElements([...elements, newEl])
        setSelectedId(newEl.id)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  const updateSelected = (patch: Partial<CanvasElement>) => {
    if (!selectedId) return
    setElements(elements.map((el) => (el.id === selectedId ? { ...el, ...patch } : el)))
  }

  const deleteSelected = () => {
    if (!selectedId) return
    setElements(elements.filter((el) => el.id !== selectedId))
    setSelectedId(null)
  }

  const bringToFront = () => {
    if (!selectedId) return
    const el = elements.find((e) => e.id === selectedId)
    if (!el) return
    setElements([...elements.filter((e) => e.id !== selectedId), el])
  }

  // Pointer Canvas Dragging
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    // Find clicked element in reverse order (topmost first)
    const clicked = [...elements].reverse().find((el) => {
      return clickX >= el.x && clickX <= el.x + el.width && clickY >= el.y && clickY <= el.y + el.height
    })

    if (clicked) {
      setSelectedId(clicked.id)
      setIsDragging(true)
      setDragOffset({ x: clickX - clicked.x, y: clickY - clicked.y })
    } else {
      setSelectedId(null)
    }
  }

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedId) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    setElements((prev) =>
      prev.map((el) =>
        el.id === selectedId
          ? {
              ...el,
              x: Math.round(currentX - dragOffset.x),
              y: Math.round(currentY - dragOffset.y),
            }
          : el
      )
    )
  }

  const handleCanvasPointerUp = () => {
    setIsDragging(false)
  }

  // High-Resolution 300 DPI Export
  const handleExportAndSave = () => {
    setIsExporting(true)

    // Render clean image without guides and bounding box on a high-res offscreen canvas
    const exportCanvas = document.createElement('canvas')
    const scale = 2.5 // 2.5x high-definition rendering (e.g. 1400x1400 px)
    exportCanvas.width = CANVAS_WIDTH * scale
    exportCanvas.height = CANVAS_HEIGHT * scale
    const ctx = exportCanvas.getContext('2d')

    if (ctx) {
      ctx.scale(scale, scale)

      // Background
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Elements
      elements.forEach((el) => {
        ctx.save()
        if (el.type === 'text' && el.text) {
          ctx.font = `${el.fontWeight || 'normal'} ${el.fontStyle || 'normal'} ${el.fontSize || 20}px ${el.fontFamily || 'sans-serif'}`
          ctx.fillStyle = el.color || '#FFFFFF'
          ctx.textAlign = el.textAlign || 'left'
          ctx.textBaseline = 'top'
          if (el.shadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.65)'
            ctx.shadowBlur = 8
            ctx.shadowOffsetX = 2
            ctx.shadowOffsetY = 3
          }
          const alignX =
            el.textAlign === 'center' ? el.x + el.width / 2 : el.textAlign === 'right' ? el.x + el.width : el.x
          ctx.fillText(el.text, alignX, el.y)
        } else if (el.type === 'image' && el.src) {
          const img = new Image()
          img.src = el.src
          ctx.globalAlpha = el.opacity ?? 1
          ctx.drawImage(img, el.x, el.y, el.width, el.height)
        } else if (el.type === 'sticker') {
          drawStickerGraphic(ctx, el)
        }
        ctx.restore()
      })

      const dataUrl = exportCanvas.toDataURL('image/png', 0.98)
      onSave(dataUrl)
      setIsExporting(false)
      onClose()
    }
  }

  const selectedEl = elements.find((e) => e.id === selectedId)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      style={{ background: 'rgba(2, 6, 18, 0.88)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="w-full max-w-6xl h-[92vh] flex flex-col rounded-3xl overflow-hidden border shadow-2xl"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'rgba(197, 160, 89, 0.4)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px rgba(197, 160, 89, 0.15)',
        }}
      >
        {/* Studio Top Header */}
        <div
          className="flex items-center justify-between px-6 py-3.5 border-b"
          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl text-lg" style={{ background: 'rgba(197, 160, 89, 0.15)', color: 'var(--gold)' }}>
              ✨
            </span>
            <div>
              <strong className="text-sm font-bold text-white block">
                Som Sing Phim Online Design Studio
              </strong>
              <small className="text-xs text-slate-400 font-medium">
                ປັບແຕ່ງໜ້າປົກ & ອາດເວິກພິມດິຈິຕອລ ({productName})
              </small>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowGuides(!showGuides)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                showGuides ? 'bg-gold/15 text-amber-300 border-gold' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <span>📏 {showGuides ? 'ເຊື່ອງ Safe Zone' : 'ສະແດງ Safe Zone & Bleed'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportAndSave}
              disabled={isExporting}
              className="btn btn--gold btn--sm shadow-glow flex items-center gap-1.5"
              style={{ color: '#020B1A', fontWeight: 800 }}
            >
              <CheckIcon size={16} />
              <span>{isExporting ? 'ກຳລັງປະມວນຜົນ...' : 'ບັນທຶກ ແລະ ໃຊ້ງານອອກແບບນີ້'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Studio Body: Left Sidebar + Center Canvas + Right Property Inspector */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Toolbar Tabs */}
          <div
            className="w-64 border-r flex flex-col p-4 overflow-y-auto"
            style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
          >
            {/* Tab navigation */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/60 rounded-xl mb-4 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`py-2 rounded-lg text-xs font-bold transition ${activeTab === 'text' ? 'bg-gold text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                🔤 ຂໍ້ຄວາມ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('image')}
                className={`py-2 rounded-lg text-xs font-bold transition ${activeTab === 'image' ? 'bg-gold text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                🖼️ ຮູບພາບ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stickers')}
                className={`py-2 rounded-lg text-xs font-bold transition ${activeTab === 'stickers' ? 'bg-gold text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                ⭐ ຕາປະທັບ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('background')}
                className={`py-2 rounded-lg text-xs font-bold transition ${activeTab === 'background' ? 'bg-gold text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                🎨 ພື້ນຫຼັງ
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'text' && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  ເພີ່ມຫົວຂໍ້ & ຂໍ້ຄວາມ (Add Text)
                </span>
                <button
                  type="button"
                  onClick={() => addTextElement('ຫົວຂໍ້ຫຼັກ (Main Heading)', 26, true)}
                  className="w-full py-3 px-4 rounded-xl border text-left font-extrabold text-white text-base hover:border-gold transition cursor-pointer"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
                >
                  + ເພີ່ມຫົວຂໍ້ໃຫຍ່ (Heading)
                </button>
                <button
                  type="button"
                  onClick={() => addTextElement('ຫົວຂໍ້ຍ່ອຍ (Subheading)', 16, false)}
                  className="w-full py-2.5 px-4 rounded-xl border text-left font-bold text-amber-200 text-sm hover:border-gold transition cursor-pointer"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
                >
                  + ເພີ່ມຫົວຂໍ້ຍ່ອຍ (Subheading)
                </button>
                <button
                  type="button"
                  onClick={() => addTextElement('ຂໍ້ຄວາມລາຍລະອຽດ ຫຼື ຄຳອວຍພອນ', 13, false)}
                  className="w-full py-2 px-4 rounded-xl border text-left text-slate-300 text-xs hover:border-gold transition cursor-pointer"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
                >
                  + ເພີ່ມຂໍ້ຄວາມທົ່ວໄປ (Body Text)
                </button>
              </div>
            )}

            {activeTab === 'image' && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  ອັບໂຫຼດຮູບພາບ / ໂລໂກ້
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onUploadImage(file)
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 px-4 rounded-2xl border-2 border-dashed border-gold/40 hover:border-gold flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center"
                  style={{ background: 'rgba(197, 160, 89, 0.05)' }}
                >
                  <span className="text-2xl">📸</span>
                  <strong className="text-xs text-white">ກົດເພື່ອເລືອກຮູບພາບ</strong>
                  <small className="text-[11px] text-slate-400">JPG, PNG (ຮອງຮັບພື້ນຫຼັງໂປ່ງໃສ)</small>
                </button>
              </div>
            )}

            {activeTab === 'stickers' && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  ກາປະທັບ & ກອບຄຳພິເສດ (Stamps)
                </span>
                {STICKER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => addSticker(preset)}
                    className="w-full p-2.5 rounded-xl border flex items-center gap-3 hover:border-gold transition text-left cursor-pointer"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
                  >
                    <span className="text-xl p-1.5 rounded-lg bg-slate-800">{preset.icon}</span>
                    <span className="text-xs font-bold text-slate-200">{preset.name}</span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'background' && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  ເລືອກສີພື້ນຫຼັງ (Background Color)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {BG_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setBgColor(preset.value || '#070D1E')}
                      className={`h-14 rounded-xl border p-1 flex flex-col items-center justify-center gap-1 text-center transition cursor-pointer ${
                        bgColor === preset.value ? 'ring-2 ring-gold border-gold' : 'border-slate-800'
                      }`}
                      style={{ background: preset.value || preset.gradient }}
                    >
                      <span className="text-[9px] font-bold text-slate-300 drop-shadow-md">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setElements([])}
                className="text-xs text-rose-400 hover:text-rose-300 transition cursor-pointer"
              >
                🗑️ ລ້າງທັງໝົດ (Clear)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (elements.length > 0) {
                    setElements(elements.slice(0, -1))
                  }
                }}
                className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                ↩ ຍ້ອນກັບ (Undo)
              </button>
            </div>
          </div>

          {/* Center Canvas Workspace */}
          <div
            className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden relative"
            style={{ background: '#030712' }}
          >
            {/* Visual Canvas Container with Luxury Drop Shadow */}
            <div
              className="relative rounded-2xl overflow-hidden shadow-2xl border transition-all"
              style={{
                borderColor: 'rgba(197, 160, 89, 0.3)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 20px rgba(197, 160, 89, 0.12)',
              }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                className="block cursor-crosshair touch-none select-none"
              />
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
              <span>💡 ກົດ ແລະ ລາກເພື່ອຍ້າຍຕຳແໜ່ງ (Drag & Drop)</span>
              <span>•</span>
              <span>ອັດຕາສ່ວນຂະໜາດຈິງ 300 DPI Prepress Ready</span>
            </div>
          </div>

          {/* Right Inspector Sidebar (Active Element Properties) */}
          <div
            className="w-72 border-l p-4 overflow-y-auto"
            style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
          >
            {selectedEl ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <strong className="text-xs font-bold text-white uppercase tracking-wider">
                    ⚙️ ຄຸນສົມບັດ ({selectedEl.type})
                  </strong>
                  <button
                    type="button"
                    onClick={deleteSelected}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                  >
                    ລົບຊິ້ນນີ້ ✕
                  </button>
                </div>

                {selectedEl.type === 'text' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">ຂໍ້ຄວາມ (Text):</label>
                      <input
                        type="text"
                        value={selectedEl.text || ''}
                        onChange={(e) => updateSelected({ text: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-gold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">ຟອນ (Font Family):</label>
                      <select
                        value={selectedEl.fontFamily || FONTS[0].value}
                        onChange={(e) => updateSelected({ fontFamily: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-gold"
                      >
                        {FONTS.map((f, i) => (
                          <option key={i} value={f.value}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                        <span>ຂະໜາດຟອນ (Size):</span>
                        <span>{selectedEl.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="72"
                        value={selectedEl.fontSize || 20}
                        onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                        className="w-full accent-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1.5">ສີຂໍ້ຄວາມ (Color):</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {LUXURY_COLORS.map((c, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => updateSelected({ color: c.value })}
                            className={`w-7 h-7 rounded-lg border transition ${
                              selectedEl.color === c.value ? 'ring-2 ring-gold scale-110' : 'border-slate-700'
                            }`}
                            style={{ background: c.value }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateSelected({
                            fontWeight: selectedEl.fontWeight === '800' ? 'normal' : '800',
                          })
                        }
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                          selectedEl.fontWeight === '800' ? 'bg-gold text-slate-950' : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}
                      >
                        B (ໜາ)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateSelected({
                            fontStyle: selectedEl.fontStyle === 'italic' ? 'normal' : 'italic',
                          })
                        }
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                          selectedEl.fontStyle === 'italic' ? 'bg-gold text-slate-950' : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}
                      >
                        I (ອຽງ)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelected({ shadow: !selectedEl.shadow })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                          selectedEl.shadow ? 'bg-gold text-slate-950' : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}
                      >
                        ເງົາ (Shadow)
                      </button>
                    </div>
                  </div>
                )}

                {selectedEl.type === 'image' && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                        <span>ຄວາມກວ້າງ (Width):</span>
                        <span>{selectedEl.width}px</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="500"
                        value={selectedEl.width}
                        onChange={(e) => {
                          const w = Number(e.target.value)
                          const ratio = selectedEl.height / selectedEl.width
                          updateSelected({ width: w, height: Math.round(w * ratio) })
                        }}
                        className="w-full accent-amber-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                        <span>ຄວາມໂປ່ງໃສ (Opacity):</span>
                        <span>{Math.round((selectedEl.opacity ?? 1) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={selectedEl.opacity ?? 1}
                        onChange={(e) => updateSelected({ opacity: Number(e.target.value) })}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={bringToFront}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 border border-slate-700 hover:border-gold transition cursor-pointer"
                  >
                    ⬆ ນຳຂຶ້ນມາດ້ານໜ້າສຸດ (Bring to Front)
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4">
                <span className="text-3xl mb-2">👆</span>
                <p className="text-xs font-medium">ກົດເລືອກຂໍ້ຄວາມ ຫຼື ຮູບພາບໃນແຜ່ນງານເພື່ອປັບແຕ່ງສີ, ຂະໜາດ ແລະ ຟອນ</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
