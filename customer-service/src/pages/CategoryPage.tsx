import { Link, useParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext.tsx'
import { formatMoneyCompact } from '../utils/currency.ts'
import ProductArt from '../components/ProductArt.tsx'
import { ArrowRightIcon } from '../components/icons.tsx'

export default function CategoryPage() {
  const { slug } = useParams()
  const { currency, convertTo, t, language, getCategory, getProductsByCategory } = useShop()
  const category = getCategory(slug)
  const isLao = language === 'lo'

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

  const categoryProducts = getProductsByCategory(slug)
  const categoryName = isLao ? category.name : category.nameEn
  const categoryDesc = isLao ? (category.description || category.tagline) : (category.descriptionEn || category.taglineEn || category.description)

  return (
    <section className="section section--alt">
      <div className="container">
        <div className="category-hero">
          <span className="eyebrow">{language === 'en' ? 'Category' : 'ໝວດໝູ່'} · {category.nameEn}</span>
          <h1>{categoryName}</h1>
          <p>{categoryDesc}</p>
        </div>

        {categoryProducts.length === 0 ? (
          <p className="text-center text-muted mt-3">
            {language === 'en' ? 'No products currently in this category.' : 'ຍັງບໍ່ມີສິນຄ້າໃນໝວດໝູ່ນີ້'}
          </p>
        ) : (
          <div className="product-grid">
            {categoryProducts.map((p) => {
              const price = convertTo(p.basePrice)
              const pName = !isLao && p.nameEn ? p.nameEn : p.name
              const pShort = !isLao && p.shortEn ? p.shortEn : (p.short || p.description)

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
