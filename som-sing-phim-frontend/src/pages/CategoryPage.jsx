import { Link, useParams } from 'react-router-dom'
import { getCategory, getProductsByCategory } from '../data/catalog.js'
import { useShop } from '../context/ShopContext.jsx'
import { formatMoneyCompact } from '../utils/currency.js'
import ProductArt from '../components/ProductArt.jsx'
import { ArrowRightIcon } from '../components/icons.jsx'

export default function CategoryPage() {
  const { slug } = useParams()
  const { currency, convertTo } = useShop()
  const category = getCategory(slug)
  const products = getProductsByCategory(slug)

  if (!category) {
    return (
      <section className="section text-center container">
        <h2>ไม่พบหมวดหมู่นี้</h2>
        <Link to="/" className="btn btn--navy mt-2">
          กลับหน้าแรก
        </Link>
      </section>
    )
  }

  return (
    <section className="section section--alt">
      <div className="container">
        <div className="category-hero">
          <span className="eyebrow">หมวดหมู่ · {category.nameEn}</span>
          <h1>{category.name}</h1>
          <p>{category.description}</p>
        </div>

        {products.length === 0 ? (
          <p className="text-center text-muted mt-3">
            ยังไม่มีสินค้าในหมวดหมู่นี้ โปรดกลับมาตรวจสอบในภายหลัง
          </p>
        ) : (
          <div className="product-grid">
            {products.map((p) => {
              const price = convertTo(p.basePrice)
              return (
                <Link key={p.id} to={`/product/${p.slug}`} className="product-card">
                  <div className="product-card-media">
                    <ProductArt art={p.image} />
                    {p.bestseller && <span className="product-rank">สินค้าขายดี</span>}
                  </div>
                  <div className="product-card-body">
                    <span className="product-card-cat">{category.nameEn}</span>
                    <h3>{p.name}</h3>
                    <p className="product-card-desc">{p.short}</p>
                    <div className="product-card-foot">
                      <div className="product-price">
                        <span className="product-price-label">เริ่มต้น</span>
                        <strong>{formatMoneyCompact(price, currency)}</strong>
                      </div>
                      <span className="product-card-cta">
                        เลือกสเปก <ArrowRightIcon size={16} />
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
