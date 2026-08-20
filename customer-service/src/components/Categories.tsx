import { Link } from 'react-router-dom'
import { CATEGORIES } from '../data/catalog.ts'
import { useShop } from '../context/ShopContext.tsx'
import { 
  ArrowRightIcon, 
  SparkleIcon, 
  FileTextIcon, 
  LayersIcon, 
  PackageIcon, 
  PrinterIcon 
} from './icons.tsx'

export default function Categories() {
  const { t, language } = useShop()

  return (
    <section className="section categories" id="categories">
      <div className="container">
        <div className="section-head">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-600 font-bold text-xs mb-2 border border-blue-500/20">
            <SparkleIcon size={14} /> <span>{t('categoriesBadge')}</span>
          </div>
          <h2>{t('categoriesTitle')}</h2>
          <p>{t('categoriesSub')}</p>
        </div>

        <div className="category-grid">
          {CATEGORIES.map((c, i) => (
            <Link key={c.slug} to={`/category/${c.slug}`} className="category-card group">
              <div className="category-card-top">
                <span className="category-card-num">0{i + 1}</span>
                <span className="category-card-icon-pill">
                  {c.icon === 'doc' && <PrinterIcon size={20} />}
                  {c.icon === 'photo' && <LayersIcon size={20} />}
                  {c.icon === 'sticker' && <PackageIcon size={20} />}
                  {!['doc', 'photo', 'sticker'].includes(c.icon) && <SparkleIcon size={20} />}
                </span>
              </div>
              <h3 className="category-card-title">{language === 'en' ? c.nameEn : c.name}</h3>
              <p className="category-card-desc">{language === 'en' ? c.tagline : (c.tagline || c.description)}</p>
              <div className="category-card-foot">
                <span className="category-card-link">
                  <span>{t('viewCategoryBtn')}</span>
                  <ArrowRightIcon size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
