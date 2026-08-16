// ============================================================
// Real-time Pricing Engine
// Computes unit & total prices from product base + spec add-ons
// + quantity tier discounts. Base prices are in THB.
// ============================================================

import type { Product, SpecOption } from '../data/catalog.ts'

export interface QuantityTier {
  min: number
  max: number
  discount: number
}

export const QUANTITY_TIERS: QuantityTier[] = [
  { min: 1, max: 9, discount: 0 },
  { min: 10, max: 49, discount: 0.05 },
  { min: 50, max: 99, discount: 0.1 },
  { min: 100, max: Infinity, discount: 0.15 },
]

export function getQuantityTier(qty: number): QuantityTier {
  return QUANTITY_TIERS.find((t) => qty >= t.min && qty <= t.max) || QUANTITY_TIERS[0]
}

export function pickOption<T extends SpecOption>(options: T[] | null | undefined, id: string, fallback?: T | null): T | null {
  if (!options || !Array.isArray(options)) return null
  return options.find((o) => o.id === id) || fallback || null
}

export interface ProductConfig {
  sizeId: string
  materialId: string
  finishingId: string
  quantity?: number
}

export function computeUnitPrice(product: Product, { sizeId, materialId, finishingId }: ProductConfig) {
  const size = pickOption(product.sizes, sizeId)
  const material = pickOption(product.materials, materialId)
  const finishing = pickOption(product.finishings, finishingId)

  const sizeAdd = size ? size.add : 0
  const materialAdd = material ? material.add : 0
  const finishingAdd = finishing ? finishing.add : 0

  return product.basePrice + sizeAdd + materialAdd + finishingAdd
}

export interface PriceBreakdown {
  unitPrice: number
  total: number
  totalTHB?: number
  qty: number
  discount: number
}

export function computePrice(product: Product, config: ProductConfig): PriceBreakdown {
  const qty = Math.max(1, config.quantity || 1)
  const rawUnit = computeUnitPrice(product, config)
  const tier = getQuantityTier(qty)
  const discountedUnit = Math.round(rawUnit * (1 - tier.discount))
  const total = discountedUnit * qty
  return {
    unitPrice: discountedUnit,
    total,
    totalTHB: total,
    qty,
    discount: tier.discount,
  }
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
