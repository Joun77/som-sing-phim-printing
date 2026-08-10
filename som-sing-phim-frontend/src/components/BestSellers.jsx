import { Link } from 'react-router-dom'
import { getBestsellers } from '../data/catalog.js'
import { useShop } from '../context/ShopContext.jsx'
import { formatMoneyCompact } from '../utils/currency.js'
import ProductArt from './ProductArt.jsx'
import { ArrowRightIcon, StarIcon } from './icons.jsx'

export default function BestSellers() {
  const { currency, convertTo } = useShop()
  const items = getBestsellers()

  return (
    <section className="section section--alt bestsellers" id="bestsellers">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">ขายดีที่สุด</span>
          <h2>สินค้าขายดี จากยอดสั่งซื้อจริง</h2>
          <p>อัปเดตอัตโนมัติจากประวัติการซื้อขายในระบบ — ยิ่งสั่งยิ่งคุ้ม ยิ่งได้ส่วนลดตามจำนวน</p>
        </div>

        <div className="product-grid">
          {items.map((p, i) => {
            const price = convertTo(p.basePrice)
            return (
              <Link key={p.id} to={`/product/${p.slug}`} className="product-card">
                <div className="product-card-media">
                  <ProductArt art={p.image} />
                  <span className="product-rank">อันดับ {i + 1}</span>
                  {i === 0 && (
                    <span className="product-badge product-badge--top">
                      <StarIcon size={14} /> ขายดีอันดับ 1
                    </span>
                  )}
                </div>
                <div className="product-card-body">
                  <span className="product-card-cat">
                    {['อัลบั้มรูปภาพ', 'กรอบรูปอะคริลิก', 'สติ๊กเกอร์ไดคัท', 'การ์ดเชิญ', 'หนังสือ/เอกสาร'][
                      ['albums', 'frames', 'stickers', 'cards', 'documents'].indexOf(p.category)
                    ]}
                  </span>
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
      </div>
    </section>
  )
}
