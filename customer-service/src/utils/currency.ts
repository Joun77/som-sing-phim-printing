// ============================================================
// Currency formatting & conversion (THB base, LAK/THB switchable)
// Rates are fetched from the backend /api/rates (THB -> LAK = rateToLak)
// ============================================================

export interface Currency {
  code: string
  symbol: string
  label: string
  name: string
  rateToLak: number
}

export const CURRENCIES: Currency[] = [
  { code: 'LAK', symbol: '₭', label: 'LAK ₭', name: 'ກີບລາວ', rateToLak: 1 },
  { code: 'THB', symbol: '฿', label: 'THB ฿', name: 'ບາດໄທ', rateToLak: 630.5 },
]

export const DEFAULT_CURRENCY = 'LAK'

export function convert(amountThb: number, currency: string, rateToLak: number) {
  if (currency === 'LAK') {
    return Math.round(amountThb * rateToLak)
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
  return '฿ ' + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
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
