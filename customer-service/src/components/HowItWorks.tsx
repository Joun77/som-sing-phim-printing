import { useShop } from '../context/ShopContext.tsx'
import { ArrowRightIcon, CheckIcon, SparkleIcon } from './icons.tsx'

function StepIcon({ type }: { type: string }) {
  const map = {
    cart: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="17.5" cy="20" r="1.4" />
        <path d="M2.5 3.5h2.2l2.4 12.2a1.6 1.6 0 0 0 1.6 1.3h8.9a1.6 1.6 0 0 0 1.6-1.3L21.2 8H6" />
      </svg>
    ),
    link: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13.5a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
        <path d="M14 10.5a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
      </svg>
    ),
    bank: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5 12 4l9 5.5" />
        <path d="M5 10v6.5M9.5 10v6.5M14.5 10v6.5M19 10v6.5" />
        <path d="M3.5 20h17" />
      </svg>
    ),
    truck: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1.5 6.5h13v11h-13z" />
        <path d="M14.5 10h4.6l3.4 3.6v3.9h-8" />
        <circle cx="6" cy="18.5" r="1.8" />
        <circle cx="17.5" cy="18.5" r="1.8" />
      </svg>
    ),
  }
  return (map as any)[type] || map.cart
}

export default function HowItWorks() {
  const { t } = useShop()

  const STEPS = [
    { n: 1, icon: 'cart', title: t('step1Title'), desc: t('step1Desc') },
    { n: 2, icon: 'link', title: t('step2Title'), desc: t('step2Desc') },
    { n: 3, icon: 'bank', title: t('step3Title'), desc: t('step3Desc') },
    { n: 4, icon: 'truck', title: t('step4Title'), desc: t('step4Desc') },
  ]

  return (
    <section className="section how-it-works" id="how-it-works">
      <div className="container">
        <div className="section-head">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs mb-2 border border-emerald-500/20">
            <SparkleIcon size={14} /> <span>{t('howBadge')}</span>
          </div>
          <h2>{t('howTitle')}</h2>
          <p>{t('howSub')}</p>
        </div>

        <div className="steps-grid">
          {STEPS.map((s, i) => (
            <div key={s.n} className="step-card group">
              <div className="step-head">
                <div className="step-icon">
                  <StepIcon type={s.icon} />
                </div>
                <span className="step-num-badge">STEP 0{s.n}</span>
              </div>
              <h3 className="step-card-title">{s.title}</h3>
              <p className="step-card-desc">{s.desc}</p>
              {i < STEPS.length - 1 && <span className="step-arrow-line" aria-hidden="true" />}
            </div>
          ))}
        </div>

        {/* Partners & Trust Badges */}
        <div className="how-trust-box">
          <div className="trust-item">
            <CheckIcon size={18} />
            <span>{t('trust1')}</span>
          </div>
          <div className="trust-item">
            <CheckIcon size={18} />
            <span>{t('trust2')}</span>
          </div>
          <div className="trust-item">
            <CheckIcon size={18} />
            <span>{t('trust3')}</span>
          </div>
        </div>

        <div className="how-cta">
          <a href="#bestsellers" className="btn btn--gold btn--lg shadow-glow">
            {t('startOrderNow')} <ArrowRightIcon size={18} />
          </a>
        </div>
      </div>
    </section>
  )
}
