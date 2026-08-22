import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { getBestsellers } from '../data/catalog.ts'
import { useShop } from '../context/ShopContext.tsx'
import { formatMoneyCompact } from '../utils/currency.ts'
import ProductArt from './ProductArt.tsx'
import { ArrowRightIcon, StarIcon, SparkleIcon, CheckIcon, ZapIcon, ClockIcon } from './icons.tsx'
import { fetchPublicProducts, RemoteProduct } from '../api/client.ts'

gsap.registerPlugin(ScrollTrigger)

export default function BestSellers() {
  const { currency, convertTo, t, language } = useShop()
  const isLao = language === 'lo'
  const localItems = getBestsellers()
  const [remoteProducts, setRemoteProducts] = useState<RemoteProduct[]>([])

  useEffect(() => {
    fetchPublicProducts().then((res) => {
      if (res && res.length > 0) {
        setRemoteProducts(res)
      }
    })
  }, [])

  // Featured 4 print-on-demand items
  const items: Array<{
    id: string
    slug: string
    name: string
    category: string
    basePrice: number
    image: string
    short: string
    features: string[]
    badge?: string
  }> = remoteProducts.length > 0
    ? remoteProducts.slice(0, 4).map((rp, i) => ({
        id: String(rp.id),
        slug: rp.slug,
        name: rp.name,
        category: rp.category,
        basePrice: 50,
        image: rp.thumbnailUrl || (i === 0 ? 'sticker' : i === 1 ? 'card' : i === 2 ? 'doc' : 'album'),
        short: rp.description || '',
        features: rp.features || (isLao ? ['ພິມດິຈິຕອນ 4 ສີ', 'ຈັດສົ່ງດ່ວນ 24-48h'] : ['Ultra-HD Print', '24-48h Delivery']),
        badge: i === 0 ? (isLao ? '🔥 ອັນດັບ 1 ຂາຍດີສຸດ' : '#1 Best Seller') : undefined
      }))
    : [
        {
          id: 'sticker-pp',
          slug: 'sticker-pp-waterproof',
          name: isLao ? 'ສະຕິກເກີ PP ຂາວເງົາກັນນ້ຳ 100% ໄດຄັດ' : '100% Waterproof Glossy PP Sticker',
          category: 'STICKER & LABEL',
          basePrice: 35,
          image: 'sticker',
          short: isLao ? 'ສະຕິກເກີເນື້ອ PP ພລາສຕິກກັນນ້ຳ ຕິດແກ້ວ/ຂວດ ແຊ່ຕູ້ເຢັນ ໄດຄັດ 50% ພ້ອມລອກຕິດ' : '100% waterproof PP vinyl, freeze-proof, precision kiss-cut ready to peel.',
          features: isLao ? ['ກັນນ້ຳ 100% ແຊ່ເຢັນໄດ້', 'ໄດຄັດຄົມຊັດ ±0.1mm'] : ['100% Waterproof', 'Kiss-Cut ±0.1mm'],
          badge: isLao ? '🔥 ອັນດັບ 1 ຂາຍດີສຸດ' : '#1 Best Seller'
        },
        {
          id: 'card-luxury',
          slug: 'card-luxury-foil',
          name: isLao ? 'ນາມບັດພຣີມ່ຽມ 350 GSM + ປ້ຳຟອຍຄຳ' : 'Luxury 350 GSM Gold Foil Business Card',
          category: 'BUSINESS CARD',
          basePrice: 40,
          image: 'card',
          short: isLao ? 'ເຈ້ຍອາດກາດໜາ 350g ເຄືອບດ້ານ Soft-Touch ປ້ຳຟອຍຄຳແທ້ສະທ້ອນແສງຫຼູຫຼາ' : 'Heavyweight 350 GSM stock, soft-touch matte velvet coating with metallic hot foil.',
          features: isLao ? ['ເຈ້ຍອາດກາດ 350g', 'ປ້ຳຟອຍຄຳ Metallic'] : ['350 GSM Art Card', 'Hot Stamping Foil']
        },
        {
          id: 'doc-binding',
          slug: 'doc-copy-binding',
          name: isLao ? 'ກັອບປີ້ເອກະສານ & ເຂົ້າເລັ້ມສັນກາວ/ສັນຫ່ວງ' : 'Document Copy & Thermal Glue/Wire-O Binding',
          category: 'DOCUMENTS & BOOKS',
          basePrice: 20,
          image: 'doc',
          short: isLao ? 'ພິມສີ-ຂາວດຳ ຄົມຊັດ ເຂົ້າເລັ້ມສັນກາວຮ້ອນ ສັນຫ່ວງກະດູກງູ ຫຼື ເຢັບມຸມດ່ວນ' : 'High-speed color & B&W document printing with perfect thermal glue or wire-o binding.',
          features: isLao ? ['ເລີ່ມຕົ້ນ 1 ຊຸດ (No MOQ)', 'ເຂົ້າເລັ້ມແຂງແຮງ'] : ['1 Set Minimum (No MOQ)', 'Durable Binding']
        },
        {
          id: 'album-photobook',
          slug: 'album-classic',
          name: isLao ? 'ອັນບັ້ມຮູບພາບປົກແຂງ Layflat 180°' : 'Hardcover 180° Layflat Photobook',
          category: 'PHOTO ALBUM',
          basePrice: 50,
          image: 'album',
          short: isLao ? 'ປົກແຂງຈົ່ວປັງຫຼູຫຼາ ເປີດກາງຮາບພຽງໄດ້ 180 ອົງສາ ພິມສີ CMYK ຄົມຊັດລະດັບແກເລີຣີ' : 'Rigid hardcover photobook with seamless 180° layflat binding and archival gallery ink.',
          features: isLao ? ['ເປີດຮາບພຽງ 180°', 'ປົກແຂງເຄືອບດ້ານ'] : ['180° Layflat Open', 'Hardcover Lamination']
        }
      ]

  const containerRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return

    gsap.fromTo(
      '.bestseller-product-card',
      { y: 30, opacity: 0.3 },
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
  }, { scope: containerRef, dependencies: [items.length] })

  return (
    <section className="section section--alt bestsellers-section" id="bestsellers" ref={containerRef}>
      <div className="container">
        {/* Section Header */}
        <div className="section-head text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs mb-3 border border-amber-500/20">
            <StarIcon size={14} />
            <span>{isLao ? 'ສິນຄ້າຍອດນິຍົມ (Print On Demand Bestsellers)' : 'Best Selling Print Products'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {isLao ? 'ລາຍການສິນຄ້າພິມຍອດສັ່ງຊື້ສູງສຸດ' : 'Most Popular Print On Demand Choices'}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">
            {isLao 
              ? 'ຄັດສັນງານພິມຍອດນິຍົມທີ່ລູກຄ້າສັ່ງຫຼາຍທີ່ສຸດ ສັ່ງງ່າຍ ກຳນົດສເປັກໄດ້ເອງ ລາຄາໂປ່ງໃສ' 
              : 'Our top customer favorites with instant specification builder and real-time pricing.'}
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((p, i) => {
            const price = convertTo(p.basePrice)
            return (
              <Link 
                key={p.id} 
                to={`/product/${p.slug}`} 
                className="bestseller-product-card group flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-amber-500/50 transition-all duration-300 overflow-hidden"
              >
                {/* Media Preview Box */}
                <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                  <ProductArt art={p.image} />
                  
                  {/* Rank Badge */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-black bg-slate-950/80 text-white backdrop-filter blur-sm border border-white/15">
                    #0{i + 1}
                  </span>

                  {p.badge && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-amber-500 text-slate-950 shadow-md">
                      <SparkleIcon size={12} /> {p.badge}
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 flex flex-col flex-grow justify-between">
                  <div>
                    {/* Category and Lead time */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-black tracking-wider text-amber-600 dark:text-amber-400 uppercase">
                        {p.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
                        <ZapIcon size={12} /> {isLao ? 'ພິມດ່ວນ 24–48h' : '24-48h Fast'}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors line-clamp-2 leading-snug mb-2">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {p.short}
                    </p>

                    {/* Features Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {p.features.map((feat, fIdx) => (
                        <span key={fIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <CheckIcon size={11} color="#10B981" /> {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Foot: Price & CTA */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">{t('startPriceLabel')}</span>
                      <strong className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                        {formatMoneyCompact(price, currency)}
                      </strong>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 group-hover:bg-amber-500 group-hover:text-slate-950 font-bold text-xs transition-all duration-200">
                      <span>{t('chooseSpecBtn')}</span>
                      <ArrowRightIcon size={13} />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
