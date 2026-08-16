import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCategory, getProductsByCategory, Product } from '../data/catalog.ts'
import { useShop } from '../context/ShopContext.tsx'
import { formatMoneyCompact } from '../utils/currency.ts'
import ProductArt from '../components/ProductArt.tsx'
import { ArrowRightIcon } from '../components/icons.tsx'
import { fetchPublicProducts, RemoteProduct } from '../api/client.ts'

export default function CategoryPage() {
  const { slug } = useParams()
  const { currency, convertTo, t, language } = useShop()
  const category = getCategory(slug)
  const [remoteProducts, setRemoteProducts] = useState<RemoteProduct[]>([])

  useEffect(() => {
    fetchPublicProducts(slug).then((res) => {
      if (res && res.length > 0) {
        setRemoteProducts(res)
      }
    })
  }, [slug])

  if (!category) {
    return (
      <section className="section text-center container min-h-60 flex flex-col items-center justify-center">
        <h2>{language === 'en' ? 'Category Not Found' : 'ບໍ່ພົບໝວດໝູ່ນີ້'}</h2>
        <Link to="/" className="btn btn--navy mt-2">
          {t('backToHome')}
        </Link>
      </section>
    )
  }

  const localProducts = getProductsByCategory(slug)
  
  // Combine or prioritize remote products
  const displayProducts = remoteProducts.length > 0 
    ? remoteProducts.map(rp => ({
        id: String(rp.id),
        slug: rp.slug,
        name: rp.name,
        nameEn: rp.name,
        category: rp.category,
        bestseller: false,
        basePrice: 50,
        image: rp.thumbnailUrl || 'album',
        short: rp.description || '',
        shortEn: rp.description || '',
        description: rp.description || '',
        descriptionEn: rp.description || '',
      }))
    : localProducts

  const categoryName = language === 'en' ? category.nameEn : category.name
  const categoryDesc = language === 'en' ? (category.descriptionEn || category.description) : category.description

  return (
    <section className="section section--alt">
      <div className="container">
        <div className="category-hero">
          <span className="eyebrow">{language === 'en' ? 'Category' : 'ໝວດໝູ່'} · {category.nameEn}</span>
          <h1>{categoryName}</h1>
          <p>{categoryDesc}</p>
        </div>

        {displayProducts.length === 0 ? (
          <p className="text-center text-muted mt-3">
            {language === 'en' ? 'No products currently in this category.' : 'ຍັງບໍ່ມີສິນຄ້າໃນໝວດໝູ່ນີ້'}
          </p>
        ) : (
          <div className="product-grid">
            {displayProducts.map((p) => {
              const price = convertTo(p.basePrice)
              const pName = language === 'en' && (p as any).nameEn ? (p as any).nameEn : p.name
              const pShort = language === 'en' && (p as any).shortEn ? (p as any).shortEn : p.short

              return (
                <Link key={p.id} to={`/product/${p.slug}`} className="product-card group">
                  <div className="product-card-media">
                    <ProductArt art={p.image} />
                    {p.bestseller && (
                      <span className="product-rank">
                        {language === 'en' ? 'Best Seller' : 'ສິນຄ້າຍອດນິຍົມ'}
                      </span>
                    )}
                  </div>
                  <div className="product-card-body">
                    <span className="product-card-cat">{category.nameEn}</span>
                    <h3 className="product-card-title">{pName}</h3>
                    <p className="product-card-desc">{pShort}</p>
                    <div className="product-card-foot">
                      <div className="product-price">
                        <span className="product-price-label">{t('startPriceLabel')}</span>
                        <strong>{formatMoneyCompact(price, currency)}</strong>
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
        )}
      </div>
    </section>
  )
}
