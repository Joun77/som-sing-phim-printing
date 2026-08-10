import { Link } from 'react-router-dom'
import { CATEGORIES } from '../data/catalog.js'
import { ArrowRightIcon } from './icons.jsx'

export default function Categories() {
  return (
    <section className="section categories" id="categories">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">หมวดหมู่สินค้า</span>
          <h2>เลือกหมวดงานพิมพ์ที่คุณต้องการ</h2>
          <p>ครบทุกงานพิมพ์ในที่เดียว ตั้งแต่ของที่ระลึกจนถึงงานเอกสารองค์กร</p>
        </div>

        <div className="category-grid">
          {CATEGORIES.map((c, i) => (
            <Link key={c.slug} to={`/category/${c.slug}`} className="category-card">
              <div className="category-card-num">0{i + 1}</div>
              <h3>{c.name}</h3>
              <p>{c.tagline}</p>
              <span className="category-card-link">
                ดูสินค้า <ArrowRightIcon size={16} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
