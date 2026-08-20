import React from 'react'
import { MinusIcon, PlusIcon, ZapIcon } from './icons'
import { getQuantityTier } from '../utils/pricing'

export interface QuantityStepperProps {
  value: number
  minQty: number
  onChange: (n: number) => void
  t: (key: any) => string
  isOnDemand?: boolean
  discountTiers?: Array<{ minQuantity: number; discountPercentage: number }>
}

export function QuantityStepper({
  value,
  minQty,
  onChange,
  t,
  isOnDemand,
  discountTiers,
}: QuantityStepperProps) {
  const effectiveMin = isOnDemand ? 1 : Math.max(1, minQty)
  const isBulk = effectiveMin > 1 && !isOnDemand
  const tier = getQuantityTier(value)
  const activeTiers = (discountTiers && discountTiers.length > 0)
    ? discountTiers
    : isBulk
    ? [
        { minQuantity: Math.max(effectiveMin * 2, 100), discountPercentage: 5 },
        { minQuantity: Math.max(effectiveMin * 5, 500), discountPercentage: 10 },
        { minQuantity: Math.max(effectiveMin * 10, 1000), discountPercentage: 15 },
      ]
    : []
  const hasBulkDiscount = activeTiers.length > 0

  return (
    <div className="spec-group">
      <div className="spec-group-head">
        <h3>{t('quantityLabel')}</h3>
        <span className="spec-group-hint">
          {isOnDemand || effectiveMin === 1
            ? '⚡ ງານພິມຕາມສັ່ງ On-Demand (ບໍ່ມີຂັ້ນຕ່ຳ)'
            : `📦 ງານພິມຈຳນວນຫຼາຍ (ຂັ້ນຕ່ຳ ${effectiveMin} ຊິ້ນ)`}
        </span>
      </div>

      <div className="qty-row flex-wrap gap-3">
        <div className="qty-stepper">
          <button
            type="button"
            onClick={() => onChange(Math.max(effectiveMin, value - 1))}
            disabled={value <= effectiveMin}
            aria-label="Decrease quantity"
            className={value <= effectiveMin ? 'opacity-40 cursor-not-allowed' : ''}
          >
            <MinusIcon />
          </button>
          <input
            type="number"
            min={effectiveMin}
            value={value}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10)
              onChange(isNaN(parsed) ? effectiveMin : Math.max(effectiveMin, parsed))
            }}
            aria-label="Quantity"
          />
          <button type="button" onClick={() => onChange(value + 1)} aria-label="Increase quantity">
            <PlusIcon />
          </button>
        </div>

        {!hasBulkDiscount && tier.discount > 0 && (
          <span className="qty-discount-badge inline-flex items-center gap-1">
            <ZapIcon size={14} />
            <span>
              {t('currentDiscount')} {tier.discount * 100}%{tier.max !== Infinity ? ` (≤ ${tier.max})` : ''}
            </span>
          </span>
        )}
      </div>

      {/* Tiered volume discount table */}
      {hasBulkDiscount && (
        <div
          className="w-full mt-3 p-3 rounded-2xl border"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="text-xs font-bold text-muted flex items-center gap-1.5 mb-2" style={{ color: 'var(--text-muted)' }}>
            <ZapIcon size={14} color="var(--gold)" />
            <span>ຕາຕະລາງສ່ວນຫຼຸດຕາມຈຳນວນ (Volume Discount)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {activeTiers.map((dt, idx) => {
              const isActive = value >= dt.minQuantity
              return (
                <div
                  key={idx}
                  className="p-2 rounded-xl text-center border transition-all"
                  style={{
                    background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                    borderColor: isActive ? '#10B981' : 'var(--border-subtle)',
                    color: isActive ? '#10B981' : 'var(--text-muted)',
                  }}
                >
                  <div className="text-[11px] font-semibold">≥ {dt.minQuantity} ຊິ້ນ</div>
                  <div className="text-xs font-black" style={{ color: '#10B981' }}>
                    ຫຼຸດ {dt.discountPercentage}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default QuantityStepper
