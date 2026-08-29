import React from 'react'
import { formatMoney } from '../../utils/currency.ts'
import { CheckIcon } from '../icons.tsx'
import { Settings, Sparkles } from 'lucide-react'
import type { OptionButtonProps, SpecGroupProps } from './types.ts'

export function OptionButton({ option, selected, onSelect, language, currency, convertTo, badge }: OptionButtonProps) {
  const label = language === 'en' && option.labelEn ? option.labelEn : option.label
  const hint = language === 'en' && option.hintEn ? option.hintEn : option.hint
  const priceDelta = typeof option.add === 'number' ? option.add : 0

  const formatDelta = (amt: number) => {
    if (currency === 'LAK' || !currency) {
      return formatMoney(amt, 'LAK')
    }
    return formatMoney(convertTo(amt / 630.5), currency)
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(option.id)}
      aria-pressed={selected}
      className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer overflow-hidden ${
        selected
          ? 'bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border-amber-500 shadow-md ring-2 ring-amber-500/30'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
      }`}
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs sm:text-sm font-black ${selected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
            {label}
          </span>
          {selected && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 animate-scaleIn">
              <CheckIcon className="w-3 h-3 stroke-[3]" />
            </span>
          )}
        </div>
        {hint && (
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block font-normal">
            {hint}
          </span>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <span className="text-[10.5px] font-mono font-bold text-slate-500 dark:text-slate-400">
          {priceDelta > 0 ? `+${formatDelta(priceDelta)}` : priceDelta < 0 ? `-${formatDelta(Math.abs(priceDelta))}` : 'ມາດຕະຖານ'}
        </span>
        {badge && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {badge}
          </span>
        )}
      </div>
    </button>
  )
}

export function SpecGroupSelector({
  title,
  options,
  value,
  onChange,
  displayType = 'buttons',
  hint,
  icon,
  language,
  currency,
  convertTo,
}: SpecGroupProps) {
  const selectedOption = options.find((o) => o.id === value)
  const selectedLabel = selectedOption
    ? (language === 'en' && selectedOption.labelEn ? selectedOption.labelEn : selectedOption.label)
    : ''

  if (displayType === 'dropdown') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              {icon === 'settings' ? <Settings size={14} /> : <Sparkles size={14} />}
              {title}
            </span>
            {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
          </div>
          {selectedLabel && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {selectedLabel}
            </span>
          )}
        </div>
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer"
          >
            {options.map((o) => {
              const label = language === 'en' && o.labelEn ? o.labelEn : o.label
              const addText = typeof o.add === 'number' && o.add !== 0 
                ? (currency === 'LAK' || !currency ? ` (+${formatMoney(o.add, 'LAK')})` : ` (+${formatMoney(convertTo(o.add / 630.5), currency)})`)
                : ''
              return (
                <option key={o.id} value={o.id}>
                  {label} {addText}
                </option>
              )
            })}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
            ▼
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            {icon === 'settings' ? <Settings size={14} /> : <Sparkles size={14} />}
            {title}
          </span>
          {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
        </div>
        {selectedLabel && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {selectedLabel}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        {options.map((o) => (
          <OptionButton
            key={o.id}
            option={o}
            selected={value === o.id}
            onSelect={onChange}
            language={language}
            currency={currency}
            convertTo={convertTo}
          />
        ))}
      </div>
    </div>
  )
}

export const SpecGroup = SpecGroupSelector;
