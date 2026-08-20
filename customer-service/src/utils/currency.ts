// ============================================================
// Currency formatting & multi-currency conversion
// Base: THB, Multi-quotes: LAK, CNY, USD
// Real-time rates from /api/v1/public/exchange-rates
// ============================================================

export interface Currency {
  code: string
  symbol: string
  label: string
  name: string
  rateToLak: number
  rateFromThb: number
}

export const DEFAULT_RATES = {
  THB: 1.0,
  LAK: 630.5, // 1 THB = 630.5 LAK
  CNY: 0.20,  // 1 THB = 0.20 CNY (1 CNY = 5 THB)
  USD: 0.0285 // 1 THB = 0.0285 USD (1 USD = 35 THB)
}

export const CURRENCIES: Currency[] = [
  { code: 'LAK', symbol: '₭', label: 'LAK ₭', name: 'ກີບລາວ', rateToLak: 1, rateFromThb: 630.5 },
  { code: 'THB', symbol: '฿', label: 'THB ฿', name: 'ບາດໄທ', rateToLak: 630.5, rateFromThb: 1.0 },
  { code: 'CNY', symbol: '¥', label: 'CNY ¥', name: '人民币 (Yuan)', rateToLak: 3152.5, rateFromThb: 0.20 },
  { code: 'USD', symbol: '$', label: 'USD $', name: 'US Dollar', rateToLak: 22100.0, rateFromThb: 0.0285 },
]

export const DEFAULT_CURRENCY = 'LAK'

let cachedLiveRates: Record<string, number> = { ...DEFAULT_RATES }

export async function fetchLiveExchangeRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch('/api/v1/public/exchange-rates')
    if (res.ok) {
      const data = await res.json()
      if (data.rates) {
        cachedLiveRates = { ...DEFAULT_RATES, ...data.rates }
      }
    }
  } catch {
    // Fallback to DEFAULT_RATES silently
  }
  return cachedLiveRates
}

export function getCachedRates(): Record<string, number> {
  return cachedLiveRates
}

export function convert(amountThb: number, currency: string, rateToLak: number = 630.5) {
  if (currency === 'LAK') {
    return Math.round(amountThb * rateToLak)
  }
  if (currency === 'CNY') {
    return round2(amountThb * (cachedLiveRates.CNY || 0.20))
  }
  if (currency === 'USD') {
    return round2(amountThb * (cachedLiveRates.USD || 0.0285))
  }
  return round2(amountThb)
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function formatMoney(amount: number, currency?: string) {
  const code = currency || DEFAULT_CURRENCY
  if (code === 'LAK') {
    return '₭ ' + Math.round(amount).toLocaleString('en-US')
  }
  if (code === 'CNY') {
    return '¥ ' + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  }
  if (code === 'USD') {
    return '$ ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return '฿ ' + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

/**
 * Formats price in THB alongside live conversions for LAK and CNY
 * Example: "฿ 1,500 THB (~ 945,000 LAK / 300 CNY)"
 */
export function formatMultiCurrency(
  amountThb: number,
  customRates?: Record<string, number>
): string {
  const rates = customRates || cachedLiveRates
  const lakRate = rates.LAK || 630.5
  const cnyRate = rates.CNY || 0.20

  const lakAmount = Math.round(amountThb * lakRate)
  const cnyAmount = Math.round(amountThb * cnyRate)

  const thbStr = `฿ ${amountThb.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} THB`
  const lakStr = `${lakAmount.toLocaleString('en-US')} LAK`
  const cnyStr = `${cnyAmount.toLocaleString('en-US')} CNY`

  return `${thbStr} (~ ${lakStr} / ${cnyStr})`
}

export function formatMoneyCompact(amount: number, currency?: string) {
  const code = currency || DEFAULT_CURRENCY
  if (code === 'LAK') {
    const n = Math.round(amount)
    if (n >= 1_000_000) return '₭ ' + (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return '₭ ' + (n / 1_000).toFixed(1) + 'K'
    return '₭ ' + n
  }
  if (amount >= 1_000_000) return '฿ ' + (amount / 1_000_000).toFixed(1) + 'M'
  if (amount >= 1_000) return '฿ ' + (amount / 1_000).toFixed(1) + 'K'
  return '฿ ' + round2(amount)
}
