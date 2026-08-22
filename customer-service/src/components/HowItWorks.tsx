import React, { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useShop } from '../context/ShopContext.tsx'
import { ArrowRightIcon, CheckIcon, SparkleIcon, ShieldIcon, TruckIcon, ClockIcon } from './icons.tsx'

gsap.registerPlugin(ScrollTrigger)

interface WorkflowStep {
  n: number
  titleLo: string
  titleEn: string
  descLo: string
  descEn: string
  badgeLo: string
  badgeEn: string
  icon: React.ReactNode
}

export default function HowItWorks() {
  const { language } = useShop()
  const isLao = language === 'lo'
  const containerRef = useRef<HTMLElement>(null)

  const STEPS: WorkflowStep[] = [
    {
      n: 1,
      titleLo: '1. ເລືອກສິນຄ້າ & ກຳນົດສເປັກ',
      titleEn: '1. Select Product & Specifications',
      descLo: 'ເລືອກຂະໜາດ, ຊະນິດເຈ້ຍ, ວິທີເຂົ້າເລັ້ມ ແລະ ຈຳນວນພິມ (ເລີ່ມ 1 ຊິ້ນ ບໍ່ມີຂັ້ນຕ່ຳ) ລະບົບຄິດໄລ່ລາຄາ Real-time',
      descEn: 'Configure size, paper stock, finishing craft & quantity with instant transparent live quotation.',
      badgeLo: 'ຄິດໄລ່ລາຄາທັນທີ',
      badgeEn: 'Instant Live Quote',
      icon: (
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="20" r="1.4" />
          <circle cx="17.5" cy="20" r="1.4" />
          <path d="M2.5 3.5h2.2l2.4 12.2a1.6 1.6 0 0 0 1.6 1.3h8.9a1.6 1.6 0 0 0 1.6-1.3L21.2 8H6" />
        </svg>
      )
    },
    {
      n: 2,
      titleLo: '2. ແນບໄຟລ໌ງານພິມ & ອາດເວິກ',
      titleEn: '2. Upload Artwork & Preflight',
      descLo: 'ອັບໂຫລດໄຟລ໌ PDF, AI, PSD, Canva ຫຼື ແນບລິ້ງ Google Drive ພ້ອມລະບົບກວດສອບຂະໜາດ ແລະ ສີ CMYK ອັດຕະໂນມັດ',
      descEn: 'Upload print-ready PDF, AI, PSD, Canva or Google Drive links with automatic CMYK preflight check.',
      badgeLo: 'ຮອງຮັບທຸກໄຟລ໌',
      badgeEn: 'All Formats Ready',
      icon: (
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      )
    },
    {
      n: 3,
      titleLo: '3. ກວດ Digital Proof & ຊຳລະເງິນ',
      titleEn: '3. Digital Proof & OnePay Payment',
      descLo: 'ກວດສອບຕົວຢ່າງງານພິມດິຈິຕອນ ແລະ ຊຳລະເງິນສະດວກປອດໄພຜ່ານ QR Code ຂອງທະນາຄານການຄ້າຕ່າງປະເທດລາວ (BCEL OnePay)',
      descEn: 'Review digital proof accuracy and pay securely via BCEL OnePay QR code.',
      badgeLo: 'BCEL OnePay QR',
      badgeEn: 'Instant QR Pay',
      icon: (
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      )
    },
    {
      n: 4,
      titleLo: '4. ຜະລິດດ່ວນ & ຈັດສົ່ງທົ່ວປະເທດ',
      titleEn: '4. Fast Production & Express Delivery',
      descLo: 'ຜະລິດດ້ວຍເຄື່ອງພິມດິຈິຕອນລະດັບໂປຣພາຍໃນ 24–48 ຊົ່ວໂມງ ພ້ອມຈັດສົ່ງດ່ວນເຖິງບ້ານຜ່ານ Anousith & HAL Logistics',
      descEn: 'Precision press production within 24-48 hours with nationwide express delivery across Laos.',
      badgeLo: 'ດ່ວນ 24–48 ຊມ.',
      badgeEn: '24-48h Delivery',
      icon: (
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1.5 6.5h13v11h-13z" />
          <path d="M14.5 10h4.6l3.4 3.6v3.9h-8" />
          <circle cx="6" cy="18.5" r="1.8" />
          <circle cx="17.5" cy="18.5" r="1.8" />
        </svg>
      )
    }
  ]

  useGSAP(() => {
    if (!containerRef.current) return

    gsap.fromTo(
      '.how-step-card-box',
      { y: 25, opacity: 0.3 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    )
  }, { scope: containerRef })

  return (
    <section className="section how-it-works-section" id="how-it-works" ref={containerRef}>
      <div className="container">
        {/* Section Header */}
        <div className="section-head text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-3 border border-emerald-500/20">
            <SparkleIcon size={14} />
            <span>{isLao ? 'ຂັ້ນຕອນການສັ່ງພິມ (How It Works)' : 'Simple 4-Step Print Workflow'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {isLao ? '4 ຂັ້ນຕອນສັ່ງຊື່ງ່າຍໆ ບໍ່ຕ້ອງສະໝັກສະມາຊິກ' : 'Fast & Seamless Print On Demand in 4 Steps'}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">
            {isLao
              ? 'ສັ່ງງານພິມອອນລາຍສະດວກ ວ່ອງໄວ ຄິດໄລ່ລາຄາທັນທີ ພ້ອມທີມງານຊ່ຽວຊານກວດໄຟລ໌ກ່ອນພິມຈິງ'
              : 'Order your print jobs online easily with instant pricing and preflight artwork inspection.'}
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="how-step-card-box group relative p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Step Top Bar */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300 shadow-sm">
                    {s.icon}
                  </div>
                  <span className="font-mono text-xs font-black text-slate-400 dark:text-slate-500">
                    STEP 0{s.n}
                  </span>
                </div>

                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-2">
                  {isLao ? s.badgeLo : s.badgeEn}
                </span>

                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-2">
                  {isLao ? s.titleLo : s.titleEn}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isLao ? s.descLo : s.descEn}
                </p>
              </div>

              {/* Progress Indicator line */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckIcon size={14} />
                <span>{isLao ? 'ຂັ້ນຕອນງ່າຍ & ໂປ່ງໃສ' : 'Verified Workflow'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Partners & Trust Guarantees */}
        <div className="mt-10 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-around gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <CheckIcon size={16} color="#10B981" />
            <span>{isLao ? 'ຊຳລະເງິນປອດໄພຜ່ານ BCEL OnePay QR' : '100% Secure BCEL OnePay QR'}</span>
          </div>
          <div className="flex items-center gap-2">
            <TruckIcon size={16} />
            <span>{isLao ? 'ຈັດສົ່ງດ່ວນຜ່ານ Anousith & HAL Logistics' : 'Nationwide Anousith & HAL Delivery'}</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldIcon size={16} />
            <span>{isLao ? 'ກວດເຊັກຄຸນນະພາບໄຟລ໌ ແລະ ສີກ່ອນພິມຈິງ 100%' : '100% Preflight Quality Assurance'}</span>
          </div>
        </div>

        {/* Start Order Button */}
        <div className="mt-10 text-center">
          <a href="#bestsellers" className="btn btn--gold btn--lg shadow-glow inline-flex items-center gap-2">
            <span>{isLao ? 'ເລີ່ມສັ່ງພິມເລີຍ' : 'Start Print Order Now'}</span>
            <ArrowRightIcon size={18} />
          </a>
        </div>
      </div>
    </section>
  )
}
