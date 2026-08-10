// ============================================================
// Currency formatting & conversion (THB base, LAK/THB switchable)
// Rates are fetched from the backend /api/rates (THB -> LAK = rateToLak)
// ============================================================

export const CURRENCIES = [
  { code: 'THB', symbol: '฿', label: 'THB ฿', name: 'บาทไทย', rateToLak: 630.5 },
  { code: 'LAK', symbol: '₭', label: 'LAK ₭', name: 'กีบลาว', rateToLak: 1 },
]

export const DEFAULT_CURRENCY = 'THB'

export function convert(amountThb, currency, rateToLak) {
  if (currency === 'LAK') {
    return round2(amountThb * rateToLak)
  }
  return round2(amountThb)
}

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function formatMoney(amount, currency) {
  const code = currency || DEFAULT_CURRENCY
  if (code === 'LAK') {
    return '₭ ' + Math.round(amount).toLocaleString('en-US')
  }
  return '฿ ' + amount.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function formatMoneyCompact(amount, currency) {
  const code = currency || DEFAULT_CURRENCY
  if (code === 'LAK') {
    const n = Math.round(amount)
    if (n >= 1_000_000) return '₭ ' + (n / 1_000_000).toFixed(1) + ' ล้าน'
    if (n >= 1_000) return '₭ ' + (n / 1_000).toFixed(1) + 'K'
    return '₭ ' + n
  }
  if (amount >= 1_000_000) return '฿ ' + (amount / 1_000_000).toFixed(1) + 'M'
  if (amount >= 1_000) return '฿ ' + (amount / 1_000).toFixed(1) + 'K'
  return '฿ ' + round2(amount)
}
