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
  PrinterIcon,
  ZapIcon,
  ShieldIcon
} from './icons.tsx'

gsap.registerPlugin(ScrollTrigger)

interface CategoryItem {
  slug: string
  nameLo: string
  nameEn: string
  taglineLo: string
  taglineEn: string
  iconType: string
  badgeLo: string
  badgeEn: string
  accentColor: string
  bgGlow: string
}

const CATEGORY_ITEMS: CategoryItem[] = [
  {
    slug: 'documents',
    nameLo: 'ງານເອກະສານ, ປຶ້ມ & ເຂົ້າເລັ້ມ',
    nameEn: 'Documents, Reports & Booklets',
    taglineLo: 'ກັອບປີ້ເອກະສານ, ເຂົ້າເລັ້ມສັນກາວຮ້ອນ, ສັນຫ່ວງກະດູກງູ, ປຶ້ມລາຍງານ & ວິທະຍານິພົນ',
    taglineEn: 'High-speed document printing, perfect glue binding, wire-o booklets & thesis',
    iconType: 'doc',
    badgeLo: 'No MOQ • 1 ເຫຼັ້ມກໍພິມໄດ້',
    badgeEn: 'No MOQ • 1 Book Min',
    accentColor: '#38BDF8',
    bgGlow: 'rgba(56, 189, 248, 0.12)'
  },
  {
    slug: 'stickers',
    nameLo: 'ສະຕິກເກີ & ສະຫຼາກສິນຄ້າໄດຄັດ',
    nameEn: 'Stickers & Product Labels',
    taglineLo: 'ສະຕິກເກີເນື້ອ PP ຂາວເງົາ/ດ້ານ, ເນື້ອໃສ, ກັນນ້ຳ 100%, ໄດຄັດ 50% & 100% ພ້ອມລອກຕິດ',
    taglineEn: '100% Waterproof PP vinyl, transparent film, precision kiss-cut & die-cut',
    iconType: 'sticker',
    badgeLo: 'ກັນນ້ຳ 100% • ແຊ່ຕູ້ເຢັນໄດ້',
    badgeEn: '100% Waterproof',
    accentColor: '#10B981',
    bgGlow: 'rgba(16, 185, 129, 0.12)'
  },
  {
    slug: 'business-cards',
    nameLo: 'ນາມບັດ & ກາດພຣີມ່ຽມປ້ຳຟອຍ',
    nameEn: 'Business Cards & Luxury Foil',
    taglineLo: 'ເຈ້ຍອາດກາດ 350 GSM, ເຄືອບດ້ານ Soft-Touch, ປ້ຳຟອຍຄຳ/ເງິນ/ໂຣສໂກລດ໌ & Spot UV ນູນ',
    taglineEn: '350 GSM Art Card, Soft-Touch Matte, Metallic Hot Foil & 3D Raised Spot UV',
    iconType: 'card',
    badgeLo: 'ປ້ຳຟອຍຄຳ • ຫຼູຫຼາ',
    badgeEn: 'Hot Stamping Foil',
    accentColor: '#E2BD56',
    bgGlow: 'rgba(226, 189, 86, 0.15)'
  },
  {
    slug: 'marketing',
    nameLo: 'ແຜ່ນພັບ, ໂປສເຕີ & ໃບປິວໂຄສະນາ',
    nameEn: 'Flyers, Brochures & Posters',
    taglineLo: 'ພິມສີ CMYK ຄົມຊັດ ລະອຽດສູງ, ພັບ 2-3 ຕອນ, ໂປສເຕີຂະໜາດ A3/A2/A1 ເນື້ອເຈ້ຍພຣີມ່ຽມ',
    taglineEn: 'Vibrant CMYK offset quality, tri-fold brochures, high-definition promo posters',
    iconType: 'flyer',
    badgeLo: 'ສີສົດ CMYK • ພິມດ່ວນ 24h',
    badgeEn: 'Express 24h Turnaround',
    accentColor: '#F59E0B',
    bgGlow: 'rgba(245, 158, 11, 0.12)'
  },
  {
    slug: 'photos',
    nameLo: 'ໂຟໂຕ້ບຸກ & ອັນບັ້ມຮູບພາບ Layflat',
    nameEn: 'Photobooks & Gallery Art',
    taglineLo: 'ອັນບັ້ມປົກແຂງພຣີມ່ຽມ ເປີດກາງໄດ້ 180°, ມິນິໂຟໂຕ້ບຸກ, ພິມຮູບພາບຄຸນນະພາບສູງລະດັບແກເລີຣີ',
    taglineEn: 'Hardcover layflat 180° photobooks, photo albums & archival gallery prints',
    iconType: 'photo',
    badgeLo: 'ເປີດຮາບພຽງ 180° Layflat',
    badgeEn: '180° Layflat Binding',
    accentColor: '#EC4899',
    bgGlow: 'rgba(236, 72, 153, 0.12)'
  },
  {
    slug: 'packaging',
    nameLo: 'ກ່ອງບັນຈຸພັນ & ຊອງຈົດໝາຍແບຣນ',
    nameEn: 'Custom Packaging & Envelopes',
    taglineLo: 'ກ່ອງກະດາດຄຣາຟ, ກ່ອງເຄື່ອງສຳອາງ, ຊອງຈົດໝາຍບໍລິສັດ & ຖົງເຈ້ຍແບຣນເນມພ້ອມພິມໂລໂກ້',
    taglineEn: 'Folding cartons, cosmetic boxes, corporate letterheads, envelopes & paper bags',
    iconType: 'package',
    badgeLo: 'ສ້າງແບຣນ • ຂຶ້ນຮູບຕາມສັ່ງ',
    badgeEn: 'Custom Die-Cut Box',
    accentColor: '#8B5CF6',
    bgGlow: 'rgba(139, 92, 246, 0.12)'
  }
]

export default function Categories() {
  const { t, language } = useShop()
  const isLao = language === 'lo'
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return

    // Smooth subtle reveal on scroll
    gsap.fromTo(
      '.category-card-item',
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
  }, { scope: containerRef })

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

        {/* 6 Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORY_ITEMS.map((c, i) => (
            <Link
              key={c.slug}
              to={`/category/${c.slug}`}
              className="category-card-item group relative flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-xl hover:border-amber-500/40 transition-all duration-300 overflow-hidden"
              style={{
                background: `radial-gradient(circle at 90% 10%, ${c.bgGlow} 0%, transparent 60%)`
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
                    color: c.accentColor,
                    borderColor: `${c.accentColor}40`,
                    background: `${c.accentColor}15`
                  }}
                >
                  <SparkleIcon size={12} />
                  <span>{isLao ? c.badgeLo : c.badgeEn}</span>
                </span>
              </div>

              {/* Middle: Title & Description */}
              <div className="my-2">
                <div className="flex items-center gap-3 mb-2.5">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${c.accentColor} 0%, #07152B 100%)` }}
                  >
                    {c.iconType === 'doc' && <PrinterIcon size={20} />}
                    {c.iconType === 'sticker' && <PackageIcon size={20} />}
                    {c.iconType === 'card' && <SparkleIcon size={20} />}
                    {c.iconType === 'flyer' && <LayersIcon size={20} />}
                    {c.iconType === 'photo' && <SparkleIcon size={20} />}
                    {c.iconType === 'package' && <PackageIcon size={20} />}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors m-0">
                    {isLao ? c.nameLo : c.nameEn}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {isLao ? c.taglineLo : c.taglineEn}
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
          ))}
        </div>
      </div>
    </section>
  )
}
