import React, { useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useShop } from '../context/ShopContext.tsx'
import { 
  ArrowRightIcon, 
  SparkleIcon, 
  LayersIcon, 
  PackageIcon, 
  PrinterIcon
} from './icons.tsx'

gsap.registerPlugin(ScrollTrigger)

const COLOR_PALETTE = [
  { accentColor: '#38BDF8', bgGlow: 'rgba(56, 189, 248, 0.12)', badgeLo: 'No MOQ • 1 ຊິ້ນກໍພິມໄດ້', badgeEn: 'No MOQ • 1 Min' },
  { accentColor: '#10B981', bgGlow: 'rgba(16, 185, 129, 0.12)', badgeLo: 'ກັນນ້ຳ 100% • ແຊ່ຕູ້ເຢັນໄດ້', badgeEn: '100% Waterproof' },
  { accentColor: '#E2BD56', bgGlow: 'rgba(226, 189, 86, 0.15)', badgeLo: 'ຄົມຊັດ • ຫຼູຫຼາ', badgeEn: 'Luxury Stamping' },
  { accentColor: '#F59E0B', bgGlow: 'rgba(245, 158, 11, 0.12)', badgeLo: 'ສີສົດ CMYK • ພິມດ່ວນ 24h', badgeEn: 'Express 24h' },
  { accentColor: '#EC4899', bgGlow: 'rgba(236, 72, 153, 0.12)', badgeLo: 'ສີສັນສົດໃສລະດັບ Gallery', badgeEn: 'Gallery Prints' },
  { accentColor: '#8B5CF6', bgGlow: 'rgba(139, 92, 246, 0.12)', badgeLo: 'ສ້າງແບຣນ • ຂຶ້ນຮູບຕາມສັ່ງ', badgeEn: 'Custom Packaging' },
  { accentColor: '#6366F1', bgGlow: 'rgba(99, 102, 241, 0.12)', badgeLo: 'ຄົບວົງຈອນ • ມາດຕະຖານສູງ', badgeEn: 'Full Print Range' },
]

export default function Categories() {
  const { categories, language } = useShop()
  const isLao = language === 'lo'
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return
    const cards = containerRef.current.querySelectorAll('.category-card-item')
    if (cards.length === 0) return

    gsap.fromTo(
      cards,
      { y: 25, opacity: 0.3 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.08,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    )
  }, { scope: containerRef, dependencies: [categories?.length] })

  return (
    <section className="section categories-showcase-section" id="categories" ref={containerRef}>
      <div className="container">
        {/* Section Header */}
        <div className="section-head text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400 font-bold text-xs mb-3 border border-blue-500/20">
            <SparkleIcon size={14} />
            <span>{isLao ? 'ໝວດໝູ່ບໍລິການພິມຄົບວົງຈອນ (Print Categories)' : 'Complete Print On Demand Services'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {isLao ? 'ເລືອກໝວດງານພິມທີ່ທ່ານຕ້ອງການ' : 'Explore Our Print On Demand Categories'}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">
            {isLao 
              ? 'ໂຮງພິມດິຈິຕອນ ແລະ ອອບເຊັດມາດຕະຖານສູງ ພິມໄດ້ຕັ້ງແຕ່ 1 ຊິ້ນ (No MOQ) ຈົນເຖິງລະດັບອຸດສາຫະກຳ' 
              : 'Professional digital & offset printing from 1 single piece with no minimum order quantity.'}
          </p>
        </div>

        {/* Dynamic Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(categories || []).map((c, i) => {
            const styleProps = COLOR_PALETTE[i % COLOR_PALETTE.length]
            return (
              <Link
                key={c.slug}
                to={`/category/${c.slug}`}
                className="category-card-item group relative flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-xl hover:border-amber-500/40 transition-all duration-300 overflow-hidden"
                style={{
                  background: `radial-gradient(circle at 90% 10%, ${styleProps.bgGlow} 0%, transparent 60%)`
                }}
              >
                {/* Top Row: Index & Category Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider">
                    #0{i + 1}
                  </span>
                  <span 
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border"
                    style={{
                      color: styleProps.accentColor,
                      borderColor: `${styleProps.accentColor}40`,
                      background: `${styleProps.accentColor}15`
                    }}
                  >
                    <SparkleIcon size={12} />
                    <span>{isLao ? styleProps.badgeLo : styleProps.badgeEn}</span>
                  </span>
                </div>

                {/* Middle: Title & Description */}
                <div className="my-2">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${styleProps.accentColor} 0%, #07152B 100%)` }}
                    >
                      {c.icon === 'book' || c.icon === 'doc' ? <PrinterIcon size={20} /> :
                       c.icon === 'sticker' ? <PackageIcon size={20} /> :
                       c.icon === 'box' || c.icon === 'package' ? <PackageIcon size={20} /> :
                       c.icon === 'card' || c.icon === 'flyer' ? <LayersIcon size={20} /> :
                       <SparkleIcon size={20} />}
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors m-0">
                      {isLao ? c.name : c.nameEn}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {isLao ? (c.tagline || c.description) : (c.taglineEn || c.descriptionEn)}
                  </p>
                </div>

                {/* Bottom: Action CTA */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                    {isLao ? 'ເບິ່ງລາຍການສິນຄ້າ' : 'Explore Products'}
                  </span>
                  <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300 transform group-hover:translate-x-1 shadow-sm">
                    <ArrowRightIcon size={14} />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
