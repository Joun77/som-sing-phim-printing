import { Link } from 'react-router-dom'
import { CATEGORIES } from '../data/catalog.ts'
import { ArrowRightIcon } from './icons.tsx'

export default function Categories() {
  return (
    <section className="section categories" id="categories">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">ໝວດໝູ່ສິນຄ້າ (Categories)</span>
          <h2>ເລືອກໝວດງານພິມທີ່ທ່ານຕ້ອງການ</h2>
          <p>ຄົບທຸກງານພິມໃນທີ່ດຽວ ຕັ້ງແຕ່ຂອງທີ່ລະນຶກ ຈົນເຖິງງານເອກະສານອົງກອນ</p>
        </div>

        <div className="category-grid">
          {CATEGORIES.map((c, i) => (
            <Link key={c.slug} to={`/category/${c.slug}`} className="category-card">
              <div className="category-card-num">0{i + 1}</div>
              <h3>{c.name}</h3>
              <p>{c.tagline}</p>
              <span className="category-card-link">
                ເບິ່ງສິນຄ້າ <ArrowRightIcon size={16} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
