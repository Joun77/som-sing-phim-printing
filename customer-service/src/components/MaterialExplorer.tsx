import React, { useState, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useShop } from '../context/ShopContext.tsx'
import { SparkleIcon } from './icons.tsx'

gsap.registerPlugin(ScrollTrigger)

interface MaterialFinish {
  id: string
  nameLao: string
  nameEn: string
  descLao: string
  descEn: string
  gsm: string
  textureGradient: string
  foilShine: string
  badge: string
}

const FINISHES: MaterialFinish[] = [
  {
    id: 'art-matt',
    nameLao: 'ເຈ້ຍອາດດ້ານ 300 GSM + Soft-Touch Laminate',
    nameEn: '300 GSM Art Card with Soft-Touch Matte Laminate',
    descLao: 'ເນື້ອເຈ້ຍອາດກາດພຣີມ່ຽມ ຫນາແໜ້ນ ສີພິມ CMYK ຄົມຊັດ ສວມຜິວສຳຜັດລະມຸນມື ປ້ອງກັນຮອຍຂູດຂີດ',
    descEn: 'Heavyweight premium coated stock with velvety matte lamination for true-to-life CMYK reproduction.',
    gsm: '300-350 GSM',
    textureGradient: 'linear-gradient(135deg, #182C56 0%, #0B1938 100%)',
    foilShine: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)',
    badge: '📄 High-End Paper Stock'
  },
  {
    id: 'metallic-foil',
    nameLao: 'ປ້ຳຟອຍຮ້ອນ Metallic Hot Stamping Foil',
    nameEn: 'Precision Metallic Hot Stamping Foil (Gold / Silver / Copper)',
    descLao: 'ເທັກນິກປ້ຳຟອຍຮ້ອນດ້ວຍແມ່ພິມໂລຫະ ໃຫ້ແສງສະທ້ອນຄົມຊັດ ເນັ້ນໂລໂກ້ ແລະ ຕົວໜັງສືໃຫ້ໂດດເດັ່ນ',
    descEn: 'Thermal magnesium block stamping transferring brilliant reflective foil onto uncoated or laminated paper.',
    gsm: '260-400 GSM',
    textureGradient: 'linear-gradient(135deg, #EBD8B2 0%, #C5A059 50%, #8F6D2C 100%)',
    foilShine: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9) 0%, transparent 60%)',
    badge: '✨ Hot Foil Finishing'
  },
  {
    id: 'spot-uv',
    nameLao: 'ເຄືອບສະປອດ UV ນູນ 3 ມິຕິ (Dimensional Spot UV)',
    nameEn: 'Dimensional Raised Spot UV Varnish',
    descLao: 'ເຄືອບວານິສເງົາສະເພາະຈຸດແບບນູນ ສຳຜັດມີມິຕິເທິງພື້ນຜິວດ້ານ ສ້າງຄວາມແຕກຕ່າງໃນການສຳຜັດ',
    descEn: 'Selective high-gloss polymer coating cured by UV light to produce dimensional tactile relief.',
    gsm: '300-350 GSM',
    textureGradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    foilShine: 'linear-gradient(45deg, transparent 35%, rgba(255,255,255,0.4) 50%, transparent 65%)',
    badge: '💎 3D Spot Coating'
  },
  {
    id: 'emboss',
    nameLao: 'ປ້ຳນູນ / ປ້ຳຈົມ ຂຶ້ນຮູບ (Artisan Blind Emboss / Deboss)',
    nameEn: 'Precision Blind Embossing / Debossing',
    descLao: 'ການອັດແຮງດັນສູງຂຶ້ນຮູບເນື້ອເຈ້ຍ ໂດຍບໍ່ຕ້ອງໃຊ້ໝຶກພິມ ໃຫ້ມິຕິເລິກຊັດເຈນ ຄົງຄວາມຄລາດສິກ',
    descEn: 'Deep pressure male/female die pressing creating tactile dimensional relief in raw paper fibers.',
    gsm: '250-450 GSM',
    textureGradient: 'linear-gradient(135deg, #F4EFEA 0%, #E5DDD0 50%, #D0C3B2 100%)',
    foilShine: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.65) 0%, transparent 70%)',
    badge: '🏛️ Artisan Die Press'
  },
  {
    id: 'linen-kraft',
    nameLao: 'ເຈ້ຍເນື້ອຜ້າລິນິນ & ເຈ້ຍຄຣາຟ (Linen & Recycled Kraft Stock)',
    nameEn: 'Textured Linen Weave & Eco Kraft Board',
    descLao: 'ເນື້ອເຈ້ຍມີລວດລາຍເສັ້ນໃຍທຳມະຊາດ ສຳຜັດອິນຊີ ແລະ ໃຫ້ຄວາມຮູ້ສຶກອົບອຸ່ນ ເໝາະກັບແບຣນຮັກໂລກ',
    descEn: 'Embossed woven linen pattern and unbleached organic kraft board for tactile organic authenticity.',
    gsm: '250-350 GSM',
    textureGradient: 'linear-gradient(135deg, #D7C4A5 0%, #B89F78 50%, #9B825D 100%)',
    foilShine: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.3) 0%, transparent 60%)',
    badge: '🌿 Eco & Textured Stock'
  }
]

export default function MaterialExplorer() {
  const [activeFinish, setActiveFinish] = useState<MaterialFinish>(FINISHES[0])
  const { language } = useShop()
  const isLao = language === 'lo'
  const containerRef = useRef<HTMLElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return

    gsap.fromTo(
      '.material-explorer-head',
      { y: 25, opacity: 0.3 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    )

    gsap.fromTo(
      '.material-picker-item',
      { x: -20, opacity: 0.3 },
      {
        x: 0,
        opacity: 1,
        stagger: 0.06,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.material-picker-list',
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    )

    gsap.fromTo(
      '.material-preview-stage',
      { scale: 0.96, opacity: 0.4 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.material-preview-stage',
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    )
  }, { scope: containerRef })

  // Trigger smooth card flip/fade on active finish change
  useGSAP(() => {
    if (!cardRef.current) return
    gsap.fromTo(
      cardRef.current,
      { opacity: 0.4, scale: 0.96, rotateY: -8 },
      { opacity: 1, scale: 1, rotateY: 0, duration: 0.45, ease: 'power2.out' }
    )
  }, { dependencies: [activeFinish.id] })

  return (
    <section className="section material-explorer-section" ref={containerRef}>
      <div className="container">
        <div className="section-head text-center material-explorer-head">
          <div className="section-badge inline-flex items-center gap-2">
            <div className="cmyk-bar">
              <span className="cmyk-dot cmyk-dot--c" />
              <span className="cmyk-dot cmyk-dot--m" />
              <span className="cmyk-dot cmyk-dot--y" />
              <span className="cmyk-dot cmyk-dot--k" />
            </div>
            <span>{isLao ? 'ວັດສະດຸເຈ້ຍ & ເທັກນິກຫຼັງການພິມ' : 'Paper Stock & Post-Press Finishes'}</span>
          </div>
          <h2>{isLao ? 'ມາດຕະຖານເນື້ອເຈ້ຍ ແລະ ເທັກນິກພິມລະດັບມືອາຊີບ' : 'Print Press Substrates & Finishing Craft'}</h2>
          <p className="text-muted max-w-xl mx-auto">
            {isLao
              ? 'ເລືອກສຳຜັດຄຸນນະພາບເນື້ອເຈ້ຍ, ນ້ຳໜັກແກຣມ, ລະບົບສີ CMYK ແລະ ເທັກນິກປ້ຳຂຶ້ນຮູບທີ່ເໝາະກັບງານພິມຂອງທ່ານ'
              : 'Explore paper stock weights, calibrated CMYK color precision, tactile laminations, and post-press finishing techniques.'}
          </p>
        </div>

        <div className="material-explorer-grid">
          {/* Swatch Selector */}
          <div className="material-picker-list" role="tablist">
            {FINISHES.map(item => {
              const isSelected = item.id === activeFinish.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`material-picker-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setActiveFinish(item)}
                >
                  <span
                    className="material-picker-dot"
                    style={{ background: item.textureGradient }}
                  />
                  <div className="material-picker-info">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong>{isLao ? item.nameLao : item.nameEn}</strong>
                      <span className="material-badge">{item.badge}</span>
                      <span className="material-badge" style={{ background: 'rgba(2, 132, 199, 0.12)', color: 'var(--press-blue)' }}>
                        {item.gsm}
                      </span>
                    </div>
                    <small>{isLao ? item.descLao : item.descEn}</small>
                  </div>
                </button>
              )
            })}
          </div>

          {/* 3D Interactive Swatch Preview Card */}
          <div className="material-preview-stage">
            <div className="material-card-3d" ref={cardRef}>
              <div
                className="material-card-surface"
                style={{
                  background: activeFinish.textureGradient,
                }}
              >
                <div
                  className="material-foil-layer"
                  style={{
                    background: activeFinish.foilShine,
                  }}
                />
                
                {/* Print Registration Marks in 4 corners */}
                <div className="crop-corner top-left">⌜</div>
                <div className="crop-corner top-right">⌝</div>
                <div className="crop-corner bottom-left">⌞</div>
                <div className="crop-corner bottom-right">⌟</div>

                <div className="material-card-embellishment">
                  <div className="material-logo-watermark">
                    <img src="/logo.png" alt="Embossed Logo" className="filter-gold" />
                  </div>
                  <div className="material-card-text">
                    <span className="atelier-mark">SOM SING PHIM • OFFSET & DIGITAL PRESS</span>
                    <h3>{isLao ? activeFinish.nameLao : activeFinish.nameEn}</h3>
                    <p>{isLao ? `ນ້ຳໜັກເຈ້ຍມາດຕະຖານ: ${activeFinish.gsm}` : `Standard Press Weight: ${activeFinish.gsm}`}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="material-preview-footer">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="print-registration-mark">⊕ CALIBRATED PROOF</span>
                  <span className="text-muted">
                    {isLao ? '✓ ຮອງຮັບທຸກຂະໜາດ ແລະ ໄຟລ໌ງານພິມ' : '✓ Compatible with Custom Print Orders'}
                  </span>
                </div>
                <span className="badge-luxury">{activeFinish.badge}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
