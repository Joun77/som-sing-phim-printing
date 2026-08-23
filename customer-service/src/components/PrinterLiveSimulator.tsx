import React, { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useShop } from '../context/ShopContext.tsx'
import { SparkleIcon, ZapIcon, CheckIcon, LayersIcon, StarIcon } from './icons.tsx'

interface PrintJob {
  id: string
  nameLao: string
  nameEn: string
  category: string
  material: string
  badge: string
  accentColor: string
  bgPattern: string
  foilShimmer: boolean
}

const PRINT_JOBS: PrintJob[] = [
  {
    id: 'sticker',
    nameLao: 'ສະຕິກເກີ PP ຂາວເງົາກັນນ້ຳ 100%',
    nameEn: 'Waterproof Glossy PP Sticker',
    category: 'DIE-CUT STICKER',
    material: 'PP Gloss 120μ + UV Resistant',
    badge: '100% Waterproof',
    accentColor: '#f97316',
    bgPattern: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
    foilShimmer: false
  },
  {
    id: 'business-card',
    nameLao: 'ນາມບັດ Soft-Touch + ປ້ຳຟອຍຄຳ 24K',
    nameEn: 'Luxury 24K Gold Foil Art Card',
    category: 'HOT STAMPING FOIL',
    material: '350 GSM Velvet Matte Touch',
    badge: '24K Foil Stamping',
    accentColor: '#c5a059',
    bgPattern: 'linear-gradient(145deg, #0b1938 0%, #060e22 50%, #020612 100%)',
    foilShimmer: true
  },
  {
    id: 'brochure',
    nameLao: 'ແຜ່ນພັບໂປຣໂມຊັ່ນ 4 ສີ Ultra-HD',
    nameEn: 'Tri-Fold Premium Brochure',
    category: 'OFFSET 4-COLOR',
    material: '160 GSM Art Paper Gloss',
    badge: '2400 DPI Precision',
    accentColor: '#0284c7',
    bgPattern: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
    foilShimmer: false
  }
]

export default function PrinterLiveSimulator() {
  const [selectedJob, setSelectedJob] = useState<PrintJob>(PRINT_JOBS[0])
  const [isPrinting, setIsPrinting] = useState(false)
  const [sheetCount, setSheetCount] = useState(1)
  const { language } = useShop()
  const isLao = language === 'lo'

  const containerRef = useRef<HTMLDivElement>(null)
  const paperCardRef = useRef<HTMLDivElement>(null)
  const laserLineRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)

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

    // 1. Reset paper card inside slot
    tl.set(paperCardRef.current, {
      y: -60,
      opacity: 0,
      scale: 0.95,
      filter: 'blur(4px)'
    })

    // 2. Laser scan sweep
    tl.to(laserLineRef.current, {
      opacity: 1,
      y: 180,
      duration: 0.5,
      ease: 'power1.inOut',
      repeat: 1,
      yoyo: true
    }, 0)

    // 3. Paper card glides down into crystal clear preview
    tl.to(paperCardRef.current, {
      y: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      duration: 0.7,
      ease: 'power2.out'
    }, 0.2)

    // 4. Shimmer glare reflection sweep
    if (glareRef.current) {
      tl.fromTo(glareRef.current, 
        { x: '-100%', opacity: 0 }, 
        { x: '100%', opacity: 0.7, duration: 0.8, ease: 'power2.inOut' },
        0.5
      )
    }

    // 5. Laser fades
    tl.to(laserLineRef.current, {
      opacity: 0,
      duration: 0.2
    }, '-=0.2')
  }

  // Trigger print animation when job selection changes
  useGSAP(() => {
    triggerPrintAnimation()
  }, { scope: containerRef, dependencies: [selectedJob.id] })

  // Auto-cycle idle print every 9 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPrinting) {
        triggerPrintAnimation()
      }
    }, 9000)
    return () => clearInterval(timer)
  }, [isPrinting])

  return (
    <div className="atelier-showcase-wrapper" ref={containerRef}>
      {/* Studio Card Frame (Light & Luxury Ivory Atelier Theme) */}
      <div className="atelier-studio-card">
        
        {/* Atelier Header & Live Calibration Bar */}
        <div className="atelier-header-strip">
          <div className="studio-brand-badge">
            <span className="live-status-dot" />
            <span className="studio-title">SOM SING PHIM • ATELIER C9070</span>
          </div>

          <div className="cmyk-process-strip">
            <span className="cmyk-pill pill--c" title="Cyan 100%">C</span>
            <span className="cmyk-pill pill--m" title="Magenta 100%">M</span>
            <span className="cmyk-pill pill--y" title="Yellow 100%">Y</span>
            <span className="cmyk-pill pill--k" title="Key Black 100%">K</span>
            <span className="dpi-tag">2400 DPI</span>
          </div>
        </div>

        {/* Paper Ejection / Showcase Stage */}
        <div className="atelier-stage-view">
          {/* Laser Calibration Scanline */}
          <div className="atelier-laser-sweep" ref={laserLineRef} />

          {/* Ejecting Real Paper Sample (Targeted by GSAP) */}
          <div 
            className={`sample-sheet-card ${selectedJob.id === 'business-card' ? 'theme--dark-foil' : 'theme--light'}`}
            ref={paperCardRef}
            style={{ background: selectedJob.bgPattern }}
          >
            {/* Top Registration Mark & Spec Tag */}
            <div className="sheet-top-meta">
              <span className="sheet-category-chip" style={{ borderColor: selectedJob.accentColor }}>
                {selectedJob.category}
              </span>
              <span className="registration-target">⊕ CALIBRATED ±0.05mm</span>
            </div>

            {/* Main Spec Content */}
            <div className="sheet-spec-body">
              <div className="spec-badge-pill" style={{ background: `${selectedJob.accentColor}20`, color: selectedJob.accentColor, borderColor: `${selectedJob.accentColor}50` }}>
                <SparkleIcon size={13} />
                <span>{selectedJob.badge}</span>
              </div>
              <h3 className="sheet-main-title">
                {isLao ? selectedJob.nameLao : selectedJob.nameEn}
              </h3>
              <p className="sheet-material-desc">
                {selectedJob.material}
              </p>
            </div>

            {/* Proof Swatches & Inspection Footer */}
            <div className="sheet-proof-footer">
              <div className="proof-swatches-row">
                <span className="swatch c" />
                <span className="swatch m" />
                <span className="swatch y" />
                <span className="swatch k" />
                <span className="swatch gold" />
              </div>
              <span className="proof-code">SSP-PROOF • BATCH #{sheetCount}</span>
            </div>

            {/* Gloss / Foil Reflection Glare */}
            <div className="foil-glare-effect" ref={glareRef} />
          </div>
        </div>

        {/* Material Switcher Tabs (Clean & Ultra-Responsive on Mobile) */}
        <div className="atelier-controls-row">
          <div className="material-tabs-list">
            {PRINT_JOBS.map((job) => {
              const isActive = job.id === selectedJob.id
              return (
                <button
                  key={job.id}
                  type="button"
                  className={`material-tab-btn ${isActive ? 'is-active' : ''}`}
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
            className="btn-studio-print"
            onClick={triggerPrintAnimation}
            disabled={isPrinting}
            title={isLao ? 'ທົດສອບພິມໃໝ່' : 'Test Print Sample'}
          >
            <ZapIcon size={14} />
            <span>{isPrinting ? (isLao ? 'ກຳລັງພິມ...' : 'Printing...') : (isLao ? 'ທົດສອບ' : 'Print')}</span>
          </button>
        </div>
      </div>

      {/* Floating Trust Metric Badges */}
      <div className="atelier-floating-badge badge--top-left animate-float-slow">
        <div className="badge-icon-box text-amber-600 bg-amber-50 border-amber-200">
          <SparkleIcon size={16} />
        </div>
        <div className="badge-text-box">
          <strong>{isLao ? 'ພິມລະອຽດສູງ Ultra-HD' : 'Ultra-HD Precision'}</strong>
          <small>Offset & Digital Press 2400 DPI</small>
        </div>
      </div>

      <div className="atelier-floating-badge badge--bottom-right animate-float-delayed">
        <div className="badge-icon-box text-emerald-600 bg-emerald-50 border-emerald-200">
          <CheckIcon size={16} />
        </div>
        <div className="badge-text-box">
          <strong>{isLao ? 'ຕັດ & ໄດຄັດຄົມຊັດ 100%' : 'Precision Laser Die-Cut'}</strong>
          <small>±0.05mm Kiss-Cut Guarantee</small>
        </div>
      </div>
    </div>
  )
}
