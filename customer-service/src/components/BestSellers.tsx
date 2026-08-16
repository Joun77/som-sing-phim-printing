import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBestsellers } from '../data/catalog.ts'
import { useShop } from '../context/ShopContext.tsx'
import { formatMoneyCompact } from '../utils/currency.ts'
import ProductArt from './ProductArt.tsx'
import { ArrowRightIcon, StarIcon, SparkleIcon, CheckIcon, ZapIcon } from './icons.tsx'
import { fetchPublicProducts, RemoteProduct } from '../api/client.ts'

export default function BestSellers() {
  const { currency, convertTo, t, language } = useShop()
  const localItems = getBestsellers()
  const [remoteProducts, setRemoteProducts] = useState<RemoteProduct[]>([])

  useEffect(() => {
    fetchPublicProducts().then((res) => {
      if (res && res.length > 0) {
        setRemoteProducts(res)
      }
    })
  }, [])

  // If remote products exist, map them for display
  const items: Array<{
    id: string;
    slug: string;
    name: string;
    category: string;
    basePrice: number;
    image: string;
    short: string;
    features?: string[];
  }> = remoteProducts.length > 0
    ? remoteProducts.slice(0, 4).map(rp => ({
        id: String(rp.id),
        slug: rp.slug,
        name: rp.name,
        category: rp.category,
        basePrice: 50,
        image: rp.thumbnailUrl || 'album',
        short: rp.description || '',
        features: rp.features || (language === 'en' ? ['High Resolution', 'Fast Delivery'] : ['ຄຸນນະພາບສູງ', 'ຈັດສົ່ງໄວ']),
      }))
    : localItems.map(p => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category,
        basePrice: p.basePrice,
        image: p.image,
        short: p.short,
        features: language === 'en' ? ['Sharp Digital Print', 'Standard Quality'] : ['ພິມຄົມຊັດ', 'ມາດຕະຖານໂຮງພິມ'],
      }))

  return (
    <section className="section section--alt bestsellers" id="bestsellers">
      <div className="container">
        <div className="section-head">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs mb-2 border border-amber-500/20">
            <StarIcon size={14} /> <span>{t('bestSellerBadge')}</span>
          </div>
          <h2>{t('bestSellerTitle')}</h2>
          <p>{t('bestSellerSub')}</p>
        </div>

        <div className="product-grid">
          {items.map((p, i) => {
            const price = convertTo(p.basePrice)
            return (
              <Link key={p.id} to={`/product/${p.slug}`} className="product-card group">
                <div className="product-card-media">
                  <ProductArt art={p.image} />
                  <span className="product-rank">#0{i + 1} Best Seller</span>
                  {i === 0 && (
                    <span className="product-badge product-badge--top">
                      <SparkleIcon size={13} /> {language === 'en' ? '#1 Best Choice' : 'ອັນດັບ 1 ຍອດສັ່ງຊື້'}
                    </span>
                  )}
                </div>

                <div className="product-card-body">
                  <div className="product-card-cat-wrap">
                    <span className="product-card-cat">
                      {p.category.toUpperCase()}
                    </span>
                    <span className="product-lead-badge inline-flex items-center gap-1">
                      <ZapIcon size={12} /> {t('leadTimeFast')}
                    </span>
                  </div>

                  <h3 className="product-card-title">{p.name}</h3>
                  <p className="product-card-desc">{p.short}</p>

                  {/* Feature Tags */}
                  {p.features && p.features.length > 0 && (
                    <div className="product-card-tags">
                      {p.features.slice(0, 2).map((feat, fIdx) => (
                        <span key={fIdx} className="product-tag-pill">
                          <CheckIcon size={12} /> {feat}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="product-card-foot">
                    <div className="product-price">
                      <span className="product-price-label">{t('startPriceLabel')}</span>
                      <strong className="product-price-val">{formatMoneyCompact(price, currency)}</strong>
                    </div>
                    <span className="product-card-cta">
                      <span>{t('chooseSpecBtn')}</span>
                      <ArrowRightIcon size={16} />
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
