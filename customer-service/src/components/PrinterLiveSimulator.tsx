import React, { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useShop } from '../context/ShopContext.tsx'
import { SparkleIcon, ZapIcon, CheckIcon, LayersIcon } from './icons.tsx'

interface PrintJob {
  id: string
  nameLao: string
  nameEn: string
  type: string
  paper: string
  gradient: string
  cmyk: string
  badge: string
}

const PRINT_JOBS: PrintJob[] = [
  {
    id: 'sticker',
    nameLao: 'ສະຕິກເກີ PP ຂາວເງົາກັນນ້ຳ 100%',
    nameEn: 'Waterproof Glossy PP Sticker',
    type: 'STICKER / KISS-CUT',
    paper: 'PP Gloss 120μ + UV Laminate',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FFA07A 100%)',
    cmyk: 'C:15% M:85% Y:90% K:0%',
    badge: '100% Waterproof'
  },
  {
    id: 'business-card',
    nameLao: 'ນາມບັດສີພິມຄົມຊັດ + ປ້ຳຟອຍຄຳແທ້',
    nameEn: 'Luxury Gold Foil Art Card',
    type: 'BUSINESS CARD / FOIL',
    paper: '350 GSM Art Card Matt + Soft Touch',
    gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
    cmyk: 'C:0% M:20% Y:60% K:90%',
    badge: 'Hot Stamping Foil'
  },
  {
    id: 'brochure',
    nameLao: 'ແຜ່ນພັບໂປຣໂມຊັ່ນ 4 ສີ ຄຸນນະພາບສູງ',
    nameEn: 'Tri-Fold Premium Brochure',
    type: 'BROCHURE / OFFSET',
    paper: '160 GSM Art Paper Gloss',
    gradient: 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #075985 100%)',
    cmyk: 'C:90% M:60% Y:10% K:5%',
    badge: 'Ultra-HD 2400 DPI'
  }
]

export default function PrinterLiveSimulator() {
  const [selectedJob, setSelectedJob] = useState<PrintJob>(PRINT_JOBS[0])
  const [isPrinting, setIsPrinting] = useState(false)
  const [sheetCount, setSheetCount] = useState(1)
  const { language } = useShop()
  const isLao = language === 'lo'

  const containerRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const laserBeamRef = useRef<HTMLDivElement>(null)
  const rollerRef = useRef<HTMLDivElement>(null)
  const inkLevelRef = useRef<HTMLDivElement>(null)

  // GSAP Print Animation Sequence
  const triggerPrintAnimation = () => {
    if (isPrinting) return
    setIsPrinting(true)

    const tl = gsap.timeline({
      onComplete: () => {
        setIsPrinting(false)
        setSheetCount(prev => prev + 1)
      }
    })

    // Reset paper position at top inside feeder
    tl.set(paperRef.current, {
      y: -140,
      opacity: 0,
      scale: 0.94,
      filter: 'brightness(1.1) drop-shadow(0 4px 6px rgba(0,0,0,0.2))'
    })

    // Laser head scan active
    tl.to(laserBeamRef.current, {
      opacity: 1,
      x: '100%',
      duration: 0.35,
      repeat: 3,
      yoyo: true,
      ease: 'power1.inOut'
    }, 0)

    // Rollers spin animation
    tl.to(rollerRef.current, {
      rotate: '+=720',
      duration: 1.4,
      ease: 'linear'
    }, 0)

    // Paper smoothly glides out from the printing slot
    tl.to(paperRef.current, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 1.2,
      ease: 'power2.out'
    }, 0.2)

    // Paper landing gentle bounce & floating sheen
    tl.to(paperRef.current, {
      y: 8,
      duration: 0.25,
      ease: 'power1.inOut',
      yoyo: true,
      repeat: 1
    }, '-=0.2')

    // Laser fades out
    tl.to(laserBeamRef.current, {
      opacity: 0,
      duration: 0.2
    }, '-=0.3')
  }

  // Initial print cycle on load
  useGSAP(() => {
    triggerPrintAnimation()
  }, { scope: containerRef, dependencies: [selectedJob.id] })

  // Auto-cycle idle print every 7 seconds if not manually clicked
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPrinting) {
        triggerPrintAnimation()
      }
    }, 7500)
    return () => clearInterval(timer)
  }, [isPrinting])

  return (
    <div className="printer-showcase-container" ref={containerRef}>
      {/* Printer Machine Outer Frame */}
      <div className="printer-press-chassis">
        {/* Machine Head Status & CMYK Gauges */}
        <div className="printer-top-bar">
          <div className="printer-brand-strip">
            <span className="printer-led-status animate-pulse" />
            <span className="printer-model-text">SOM SING PHIM • PRO PRESS C9070</span>
          </div>
          
          {/* CMYK Live Ink Levels */}
          <div className="printer-cmyk-gauges" ref={inkLevelRef}>
            <div className="cmyk-gauge" title="Cyan 98%"><span className="gauge-fill bg-cyan-400" style={{ height: '95%' }} /></div>
            <div className="cmyk-gauge" title="Magenta 92%"><span className="gauge-fill bg-pink-500" style={{ height: '90%' }} /></div>
            <div className="cmyk-gauge" title="Yellow 96%"><span className="gauge-fill bg-amber-400" style={{ height: '96%' }} /></div>
            <div className="cmyk-gauge" title="Key Black 99%"><span className="gauge-fill bg-slate-900 dark:bg-slate-300" style={{ height: '98%' }} /></div>
          </div>

          <div className="printer-dpi-badge">
            <ZapIcon size={12} />
            <span>2400 DPI</span>
          </div>
        </div>

        {/* Printer Roller Slot & Laser Scanning Carriage */}
        <div className="printer-eject-slot">
          {/* Laser Carriage Scanline */}
          <div className="printer-laser-line" ref={laserBeamRef} />
          
          {/* Mechanical Roller */}
          <div className="printer-roller" ref={rollerRef}>
            <span className="roller-ridge" />
            <span className="roller-ridge" />
            <span className="roller-ridge" />
          </div>

          {/* Ejecting Printed Paper Sheet (Animated by GSAP) */}
          <div className="printer-paper-eject" ref={paperRef}>
            <div className="printed-sheet-card" style={{ background: selectedJob.gradient }}>
              {/* Color Registration Marks & Grid */}
              <div className="sheet-cmyk-header">
                <div className="cmyk-micro-dots">
                  <span className="dot dot--c" />
                  <span className="dot dot--m" />
                  <span className="dot dot--y" />
                  <span className="dot dot--k" />
                </div>
                <span className="sheet-job-tag">{selectedJob.type}</span>
                <span className="sheet-reg-cross">⊕ 0.05mm</span>
              </div>

              {/* Artwork Content on Sheet */}
              <div className="sheet-art-content">
                <div className="sheet-badge-pill">
                  <SparkleIcon size={12} />
                  <span>{selectedJob.badge}</span>
                </div>
                <h4 className="sheet-art-title">
                  {isLao ? selectedJob.nameLao : selectedJob.nameEn}
                </h4>
                <p className="sheet-art-sub">{selectedJob.paper}</p>

                {/* Micro Barcode & Color Proof Bar */}
                <div className="sheet-foot-proof">
                  <div className="color-proof-swatches">
                    <span className="swatch-sq bg-cyan-400" />
                    <span className="swatch-sq bg-pink-500" />
                    <span className="swatch-sq bg-amber-400" />
                    <span className="swatch-sq bg-slate-900" />
                    <span className="swatch-sq bg-white" />
                  </div>
                  <span className="sheet-proof-text">CALIBRATED PRESS PROOF • #{sheetCount}</span>
                </div>
              </div>

              {/* Gloss Foil Glare Shimmer Effect */}
              <div className="sheet-foil-glare" />
            </div>
          </div>
        </div>

        {/* Printer Output Output Tray */}
        <div className="printer-tray-catch">
          <div className="tray-lip" />
        </div>
      </div>

      {/* Interactive Controls & Sample Selector */}
      <div className="printer-controls-dock">
        <div className="sample-select-list">
          {PRINT_JOBS.map(job => {
            const isCurrent = job.id === selectedJob.id
            return (
              <button
                key={job.id}
                type="button"
                className={`sample-select-btn ${isCurrent ? 'is-active' : ''}`}
                onClick={() => {
                  setSelectedJob(job)
                  triggerPrintAnimation()
                }}
              >
                <LayersIcon size={14} />
                <span>{isLao ? job.nameLao.split(' ')[0] : job.nameEn.split(' ')[0]}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className="btn-print-action"
          onClick={triggerPrintAnimation}
          disabled={isPrinting}
          title={isLao ? 'ສັ່ງພິມໃບໃໝ່' : 'Trigger Print Cycle'}
        >
          <ZapIcon size={15} />
          <span>{isPrinting ? (isLao ? 'ກຳລັງພິມ...' : 'Printing...') : (isLao ? 'ກົດພິມທົດສອບ' : 'Live Test Print')}</span>
        </button>
      </div>

      {/* Floating Trust Metric Badges */}
      <div className="printer-floating-tag printer-floating-tag--left animate-float-slow">
        <div className="tag-icon bg-amber-500/20 text-amber-500 border border-amber-500/30">
          <SparkleIcon size={16} />
        </div>
        <div className="tag-text">
          <strong>{isLao ? 'ພິມລະອຽດສູງ Ultra-HD' : 'Ultra-HD Precision'}</strong>
          <small>Xerox & Ricoh Production</small>
        </div>
      </div>

      <div className="printer-floating-tag printer-floating-tag--right animate-float-delayed">
        <div className="tag-icon bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <CheckIcon size={16} />
        </div>
        <div className="tag-text">
          <strong>{isLao ? 'ຕັດ & ໄດຄັດຄົມຊັດ 100%' : 'Precision Laser Die-Cut'}</strong>
          <small>±0.1mm Kiss-Cut Guarantee</small>
        </div>
      </div>
    </div>
  )
}
