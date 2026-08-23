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

  const presets = [10, 20, 50, 100, 200, 500, 1000]

  return (
    <div className="spec-group space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            🔢 {t('quantityLabel')}
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            {isOnDemand || effectiveMin === 1
              ? '(ບໍ່ມີຂັ້ນຕ່ຳ)'
              : `(ຂັ້ນຕ່ຳ ${effectiveMin} ຊິ້ນ)`}
          </span>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
          {value.toLocaleString()} {t('unitPiece') || 'ຊິ້ນ'}
        </span>
      </div>

      {/* Quick Select Preset Quantity Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {presets.map((presetQty) => {
          if (presetQty < effectiveMin) return null
          const isSelected = value === presetQty
          // Find if this preset gets a discount
          const discountForPreset = activeTiers
            .filter((t) => presetQty >= t.minQuantity)
            .sort((a, b) => b.discountPercentage - a.discountPercentage)[0]

          return (
            <button
              key={presetQty}
              type="button"
              onClick={() => onChange(presetQty)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-black scale-105'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <span>{presetQty.toLocaleString()}</span>
              {discountForPreset && (
                <span className={`text-[9px] px-1 py-0.2 rounded font-black ${isSelected ? 'bg-black/20 text-slate-950' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                  -{discountForPreset.discountPercentage}%
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Custom Stepper & Input */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700 shadow-inner">
          <button
            type="button"
            onClick={() => onChange(Math.max(effectiveMin, value - 1))}
            disabled={value <= effectiveMin}
            aria-label="Decrease quantity"
            className={`w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-white font-bold shadow-sm transition hover:bg-amber-500 hover:text-slate-950 ${
              value <= effectiveMin ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-95'
            }`}
          >
            <MinusIcon size={16} />
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
            className="w-20 text-center bg-transparent text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono focus:outline-none"
          />

          <button
            type="button"
            onClick={() => onChange(value + 1)}
            aria-label="Increase quantity"
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-white font-bold shadow-sm transition hover:bg-amber-500 hover:text-slate-950 cursor-pointer active:scale-95"
          >
            <PlusIcon size={16} />
          </button>
        </div>

        {!hasBulkDiscount && tier.discount > 0 && (
          <div className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
            <ZapIcon size={14} color="#10B981" />
            <span>
              {t('currentDiscount')} {tier.discount * 100}%
            </span>
          </div>
        )}
      </div>

      {/* Tiered volume discount table */}
      {hasBulkDiscount && (
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ZapIcon size={14} color="#C5A059" />
            <span>ຕາຕະລາງສ່ວນຫຼຸດຕາມຈຳນວນ (Bulk Volume Discounts)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {activeTiers.map((dt, idx) => {
              const isActive = value >= dt.minQuantity
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <div className="text-[11px] font-bold">≥ {dt.minQuantity.toLocaleString()} ຊິ້ນ</div>
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
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
