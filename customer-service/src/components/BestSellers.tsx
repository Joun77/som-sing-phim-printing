import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useShop } from '../context/ShopContext.tsx'
import { formatMoneyCompact } from '../utils/currency.ts'
import ProductArt from './ProductArt.tsx'
import { ArrowRightIcon, StarIcon, SparkleIcon, CheckIcon, ZapIcon, ClockIcon } from './icons.tsx'
import { fetchPublicProducts, RemoteProduct } from '../api/client.ts'

gsap.registerPlugin(ScrollTrigger)

export default function BestSellers() {
  const { currency, rates, convertTo, t, language, products } = useShop()
  const isLao = language === 'lo'

  // Pick top 4 products (bestsellers first)
  const bestProducts = products.filter(p => p.bestseller).concat(products.filter(p => !p.bestseller)).slice(0, 4)

  const items = bestProducts.map((p, i) => ({
    id: p.id,
    slug: p.slug,
    name: isLao ? p.name : (p.nameEn || p.name),
    category: p.category.toUpperCase(),
    basePrice: p.basePrice || 35,
    image: p.image || (i === 0 ? 'sticker' : i === 1 ? 'card' : i === 2 ? 'doc' : 'album'),
    short: isLao ? (p.short || p.description) : (p.shortEn || p.descriptionEn || p.description),
    features: p.features && p.features.length > 0 
      ? p.features.slice(0, 2) 
      : (isLao ? ['ພິມດິຈິຕອນ 4 ສີ', 'ຈັດສົ່ງດ່ວນ 24-48h'] : ['Ultra-HD Print', '24-48h Delivery']),
    badge: i === 0 ? (isLao ? 'ອັນດັບ 1 ຂາຍດີສຸດ' : '#1 Best Seller') : undefined
  }))

  const containerRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return
    const cards = containerRef.current.querySelectorAll('.bestseller-product-card')
    if (cards.length === 0) return

    gsap.fromTo(
      cards,
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
            const rawBase = p.basePrice || 0
            const price = (!currency || currency === 'LAK')
              ? rawBase
              : rawBase / (rates?.THB || 630.5)
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
