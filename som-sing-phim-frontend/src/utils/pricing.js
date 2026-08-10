// ============================================================
// Real-time Pricing Engine
// Computes unit & total prices from product base + spec add-ons
// + quantity tier discounts. Base prices are in THB.
// ============================================================

export const QUANTITY_TIERS = [
  { min: 1, max: 9, discount: 0 },
  { min: 10, max: 49, discount: 0.05 },
  { min: 50, max: 99, discount: 0.1 },
  { min: 100, max: Infinity, discount: 0.15 },
]

export function getQuantityTier(qty) {
  return QUANTITY_TIERS.find((t) => qty >= t.min && qty <= t.max) || QUANTITY_TIERS[0]
}

export function pickOption(options, id, fallback) {
  if (!options || !Array.isArray(options)) return null
  return options.find((o) => o.id === id) || fallback || null
}

export function computeUnitPrice(product, { sizeId, materialId, finishingId }) {
  const size = pickOption(product.sizes, sizeId)
  const material = pickOption(product.materials, materialId)
  const finishing = pickOption(product.finishings, finishingId)

  const sizeAdd = size ? size.add : 0
  const materialAdd = material ? material.add : 0
  const finishingAdd = finishing ? finishing.add : 0

  return product.basePrice + sizeAdd + materialAdd + finishingAdd
}

export function computePrice(product, config) {
  const qty = Math.max(1, config.quantity || 1)
  const rawUnit = computeUnitPrice(product, config)
  const tier = getQuantityTier(qty)
  const discount = tier.discount
  const unitPrice = round2(rawUnit * (1 - discount))
  const total = round2(unitPrice * qty)
  return { unitPrice, total, qty, discount }
}

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
